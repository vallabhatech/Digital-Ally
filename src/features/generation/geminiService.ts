import {
  PROMPT_TEMPLATE,
  NEWSLETTER_PROMPT_TEMPLATE,
  DASHBOARD_ANALYSIS_PROMPT_TEMPLATE,
  LANGUAGES,
} from '@/shared/constants';
import { CONSENT_VERSION, loadPrivacyPreference } from '@/shared/privacy';
import {
  AppError,
  ApiError,
  AuthAppError,
  QuotaAppError,
  ValidationAppError,
  NetworkAppError,
} from '@/shared/errors/appErrors';

interface WebsiteParams {
  description: string;
  userName: string;
  businessName: string;
  userEmail: string;
  userPhone: string;
  paletteName: string;
  paletteDetails: string;
  modificationPrompt?: string;
}

interface NewsletterParams {
  description: string;
  businessName: string;
}

interface DashboardAnalysisParams {
  dashboardData: string;
  language: string;
}

export interface GeminiHealthStatus {
  ok: boolean;
  checked: boolean;
  retrying: boolean;
  message: string;
}

type AiTask = 'website' | 'newsletter' | 'analysis';

const CLIENT_ID_KEY = 'x-client-id';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getOrCreateClientID(): string {
  if (typeof window === 'undefined') return '';

  const stored = sessionStorage.getItem(CLIENT_ID_KEY);
  if (stored) return stored;

  const clientID = crypto.randomUUID();
  sessionStorage.setItem(CLIENT_ID_KEY, clientID);
  return clientID;
}

function getClientToken(): string | null {
  const envToken = import.meta.env.VITE_SERVER_CLIENT_TOKEN;
  if (envToken) return envToken;
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sessionToken');
}

const cleanResponse = (text: string): string => {
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```html')) {
    cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
  }
  return cleanedText;
};

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function checkGeminiHealth(options?: {
  retries?: number;
  delayMs?: number;
}): Promise<GeminiHealthStatus> {
  const retries = options?.retries ?? 3;
  const delayMs = options?.delayMs ?? 1000;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
      const payload = await response.json().catch(() => null);

      if (response.ok && payload?.ok) {
        return {
          ok: true,
          checked: true,
          retrying: false,
          message: payload?.gemini?.message || 'Gemini API is available.',
        };
      }

      let message = payload?.gemini?.message || 'The server is not ready for generation requests.';
      if (typeof message === 'string') {
        if (
          message.includes('429') ||
          message.includes('RESOURCE_EXHAUSTED') ||
          message.includes('quota')
        ) {
          message =
            'Google Gemini API Quota Exceeded (429). Switch to Local-Only Mode to generate websites instantly.';
        } else if (message.startsWith('{')) {
          try {
            const parsed = JSON.parse(message);
            if (parsed.error?.message) {
              message = parsed.error.message;
            }
          } catch {
            // Keep original message if not parseable
          }
        }
      }

      if (attempt < retries) {
        await wait(delayMs * attempt);
        continue;
      }

      return {
        ok: false,
        checked: true,
        retrying: false,
        message,
      };
    } catch (error) {
      if (attempt < retries) {
        await wait(delayMs * attempt);
        continue;
      }

      return {
        ok: false,
        checked: true,
        retrying: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to reach the Gemini server. Verify the backend configuration and try again.',
      };
    }
  }

  return {
    ok: false,
    checked: true,
    retrying: false,
    message: 'The Gemini API could not be reached.',
  };
}

/**
 * All remote AI requests go through the centralized backend gateway.
 * The Gemini API key never leaves the server.
 */
async function callAiGateway(task: AiTask, body: Record<string, unknown>) {
  const preference = loadPrivacyPreference();
  if (!preference)
    throw new ValidationAppError('Choose a privacy setting before using AI features.');
  if (preference.mode === 'local')
    throw new ValidationAppError('Remote AI is disabled in local-only mode.');

  const health = await checkGeminiHealth({ retries: 1, delayMs: 250 });
  if (!health.ok) {
    throw new ApiError(health.message, 503, 'SERVICE_UNAVAILABLE');
  }

  const token = getClientToken();
  if (!token) {
    throw new AuthAppError(
      'Server client token not configured. Set VITE_SERVER_CLIENT_TOKEN in your .env file.'
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-AI-Consent': CONSENT_VERSION,
    'X-Client-ID': getOrCreateClientID(),
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${API_BASE}/api/v1/ai/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ task, ...body }),
  });

  if (res.status === 401)
    throw new AuthAppError('Unauthorized: server requires authentication.', 401);
  if (res.status === 428)
    throw new ApiError('Current AI processing consent is required.', 428, 'CONSENT_REQUIRED');

  if (res.status === 429) {
    const retryAfterHeader = res.headers.get('Retry-After');
    const retryAfter = Number.parseInt(retryAfterHeader || '900', 10);
    throw new QuotaAppError(`RATE_LIMIT_429|${retryAfterHeader || '900'}`, retryAfter);
  }

  if (!res.ok) {
    const errText = await res.text();
    let message = errText;
    let code = 'SERVER_ERROR';
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.error?.message) message = parsed.error.message;
      if (parsed?.error?.code) code = parsed.error.code;
    } catch {
      // Keep raw message
    }
    throw new ApiError(message, res.status, code);
  }

  const data = await res.json();
  if (data?.error?.message) {
    throw new ApiError(data.error.message, res.status || 400, data.error.code || 'API_ERROR');
  }
  return data;
}

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] || character
  );

function localWebsite(params: WebsiteParams): string {
  const title = escapeHtml(params.businessName || 'My Business');
  const description = escapeHtml(
    params.description || 'Quality products and services tailored for you.'
  );
  const owner = escapeHtml(params.userName || 'Business Owner');
  const email = escapeHtml(params.userEmail || 'contact@example.com');
  const phone = escapeHtml(params.userPhone || '555-0199');
  const palette = (params.paletteName || '').toLowerCase();

  let primaryGradient = 'from-indigo-600 to-violet-700';
  let primaryBtn = 'bg-indigo-600 hover:bg-indigo-700 text-white';
  let accentTag = 'bg-indigo-100 text-indigo-800';

  if (palette.includes('vibrant')) {
    primaryGradient = 'from-amber-500 to-orange-600';
    primaryBtn = 'bg-orange-600 hover:bg-orange-700 text-white';
    accentTag = 'bg-orange-100 text-orange-800';
  } else if (palette.includes('corporate')) {
    primaryGradient = 'from-blue-700 to-slate-900';
    primaryBtn = 'bg-blue-600 hover:bg-blue-700 text-white';
    accentTag = 'bg-blue-100 text-blue-800';
  } else if (palette.includes('elegant')) {
    primaryGradient = 'from-slate-900 via-gray-800 to-amber-900';
    primaryBtn = 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold';
    accentTag = 'bg-amber-100 text-amber-900';
  }

  const modBanner = params.modificationPrompt
    ? `<div class="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wider text-amber-700">Latest Requested AI Modification</p>
        <p class="text-sm font-medium text-amber-900 mt-1">"${escapeHtml(params.modificationPrompt)}"</p>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">

  <!-- Header & Navigation -->
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr ${primaryGradient} flex items-center justify-center text-white font-black text-xl shadow-md">
          ${title.charAt(0).toUpperCase()}
        </div>
        <span class="text-2xl font-bold tracking-tight text-slate-900">${title}</span>
      </div>
      <nav class="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
        <a href="#about" class="hover:text-slate-900 transition">About</a>
        <a href="#services" class="hover:text-slate-900 transition">Services</a>
        <a href="#testimonials" class="hover:text-slate-900 transition">Reviews</a>
        <a href="#contact" class="hover:text-slate-900 transition">Contact</a>
      </nav>
      <a href="#contact" class="${primaryBtn} px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm hover:shadow">
        Get in Touch
      </a>
    </div>
  </header>

  <main>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br ${primaryGradient} text-white py-24 px-6">
      <div class="max-w-5xl mx-auto text-center relative z-10">
        ${modBanner}
        <span class="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-white/15 backdrop-blur-md text-white border border-white/20 mb-6">
          Premium Quality & Craftsmanship
        </span>
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Welcome to <span class="underline decoration-wavy decoration-white/40">${title}</span>
        </h1>
        <p class="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto font-light leading-relaxed mb-10">
          ${description}
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#contact" class="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-xl hover:bg-slate-100 transition transform hover:-translate-y-0.5">
            Book Service / Order Now
          </a>
          <a href="#services" class="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition">
            Explore Features
          </a>
        </div>
      </div>
    </section>

    <!-- Services Grid Section -->
    <section id="services" class="py-20 px-6 max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">What We Offer</h2>
        <p class="text-3xl md:text-4xl font-extrabold text-slate-900">Tailored Services for You</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl ${accentTag} flex items-center justify-center text-2xl font-bold mb-6">✨</div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Artisan Offerings</h3>
          <p class="text-slate-600 leading-relaxed">Crafted with extreme attention to detail and unmatched dedication to quality standards.</p>
        </div>

        <div class="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl ${accentTag} flex items-center justify-center text-2xl font-bold mb-6">🚀</div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Fast & Reliable</h3>
          <p class="text-slate-600 leading-relaxed">Prompt service delivery focused on customer satisfaction and seamless convenience.</p>
        </div>

        <div class="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div class="w-12 h-12 rounded-xl ${accentTag} flex items-center justify-center text-2xl font-bold mb-6">🤝</div>
          <h3 class="text-xl font-bold text-slate-900 mb-3">Customer First</h3>
          <p class="text-slate-600 leading-relaxed">Personalized care and ongoing support tailored to your unique requirements.</p>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="bg-slate-100 py-20 px-6">
      <div class="max-w-5xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-slate-900 mb-12">What Our Clients Say</h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left">
            <div class="text-amber-400 mb-3">★★★★★</div>
            <p class="text-slate-700 italic mb-6">"${title} exceeded all my expectations. The quality and professionalism are top notch!"</p>
            <div class="font-bold text-slate-900">Sarah Jenkins</div>
            <div class="text-xs text-slate-500">Verified Customer</div>
          </div>
          <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-left">
            <div class="text-amber-400 mb-3">★★★★★</div>
            <p class="text-slate-700 italic mb-6">"Super fast response, fantastic communication, and incredible value. Highly recommended!"</p>
            <div class="font-bold text-slate-900">David Ross</div>
            <div class="text-xs text-slate-500">Verified Customer</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact & Information Section -->
    <section id="contact" class="py-20 px-6 max-w-5xl mx-auto">
      <div class="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl grid md:grid-cols-2 gap-12">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-900 mb-4">Contact ${title}</h2>
          <p class="text-slate-600 mb-8 leading-relaxed">Have questions or want to make an inquiry? Get in touch directly with our team.</p>

          <div class="space-y-4 font-medium text-slate-700">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">👤</span>
              <span><strong>Owner:</strong> ${owner}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">✉️</span>
              <a href="mailto:${email}" class="text-indigo-600 hover:underline">${email}</a>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">📞</span>
              <a href="tel:${phone}" class="text-indigo-600 hover:underline">${phone}</a>
            </div>
          </div>
        </div>

        <form class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Your Name</label>
            <input type="text" placeholder="John Doe" required class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Your Email</label>
            <input type="email" placeholder="john@example.com" required class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-600 mb-1">Message</label>
            <textarea rows="3" placeholder="How can we help you?" required class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
          </div>
          <button type="button" class="w-full py-4 ${primaryBtn} font-bold rounded-xl shadow-lg transition">Send Message</button>
        </form>
      </div>
    </section>
  </main>

  <footer class="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-center text-sm">
    <div class="max-w-7xl mx-auto px-6">
      <p>© ${new Date().getFullYear()} ${title}. All rights reserved.</p>
    </div>
  </footer>

</body>
</html>`;
}

export async function generateWebsite({
  description,
  userName,
  businessName,
  userEmail,
  userPhone,
  paletteName,
  paletteDetails,
  modificationPrompt,
}: WebsiteParams): Promise<string> {
  if (loadPrivacyPreference()?.mode === 'local') {
    return localWebsite({
      description,
      userName,
      businessName,
      userEmail,
      userPhone,
      paletteName,
      paletteDetails,
      modificationPrompt,
    });
  }
  const modificationSection = modificationPrompt
    ? `\n**Modification Request:** "${modificationPrompt}"`
    : '';

  const textPrompt = PROMPT_TEMPLATE.replace('{USER_NAME}', userName)
    .replace('{BUSINESS_NAME}', businessName)
    .replace('{USER_EMAIL}', userEmail)
    .replace('{USER_PHONE}', userPhone)
    .replace('{USER_INPUT}', description)
    .replace('{PALETTE_NAME}', paletteName)
    .replace('{PALETTE_DETAILS}', paletteDetails)
    .replace('{MODIFICATION_SECTION}', modificationSection);

  const data = await callAiGateway('website', { prompt: textPrompt });
  return cleanResponse(data.html || data.text || '');
}

export async function generateNewsletter({
  description,
  businessName,
}: NewsletterParams): Promise<string> {
  if (loadPrivacyPreference()?.mode === 'local') {
    return `${businessName}: Local newsletter draft\n\n${description}\n\nThank you for supporting our business.`;
  }
  const finalPrompt = NEWSLETTER_PROMPT_TEMPLATE.replace('{BUSINESS_NAME}', businessName).replace(
    '{USER_INPUT}',
    description
  );

  const data = await callAiGateway('newsletter', { prompt: finalPrompt });
  return cleanResponse(data.html || data.text || '');
}

export async function analyzeAndTranslateDashboard({
  dashboardData,
  language,
}: DashboardAnalysisParams): Promise<string> {
  if (loadPrivacyPreference()?.mode === 'local') {
    const langDetails = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
    return `Local summary (${langDetails.label}): Your dashboard data is available only in this browser. ${dashboardData.replace(/\s+/g, ' ').trim()}`;
  }
  const langDetails = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
  const finalPrompt = DASHBOARD_ANALYSIS_PROMPT_TEMPLATE.replace('{DASHBOARD_DATA}', dashboardData)
    .replace('{LANGUAGE_NAME}', langDetails.label)
    .replace('{LANGUAGE_CODE}', langDetails.value);

  const data = await callAiGateway('analysis', { prompt: finalPrompt });
  return cleanResponse(data.html || data.text || '');
}
