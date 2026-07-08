import { PROMPT_TEMPLATE, NEWSLETTER_PROMPT_TEMPLATE, DASHBOARD_ANALYSIS_PROMPT_TEMPLATE, LANGUAGES } from '@/shared/constants';
import { CONSENT_VERSION, loadPrivacyPreference } from '@/shared/privacy';

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

export async function checkGeminiHealth(options?: { retries?: number; delayMs?: number }): Promise<GeminiHealthStatus> {
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

      const message = payload?.gemini?.message || 'The server is not ready for generation requests.';
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
  if (!preference) throw new Error('Choose a privacy setting before using AI features.');
  if (preference.mode === 'local') throw new Error('Remote AI is disabled in local-only mode.');

  const health = await checkGeminiHealth({ retries: 1, delayMs: 250 });
  if (!health.ok) {
    throw new Error(health.message);
  }

  const token = getClientToken();
  if (!token) {
    throw new Error(
      'Server client token not configured. Set VITE_SERVER_CLIENT_TOKEN in your .env file (same value as SERVER_CLIENT_TOKEN on the server).'
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

  if (res.status === 401) throw new Error('Unauthorized: server requires authentication.');
  if (res.status === 428) throw new Error('Current AI processing consent is required.');

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    throw new Error(`RATE_LIMIT_429|${retryAfter || '900'}`);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Server error: ${err}`);
  }

  const data = await res.json();
  if (data?.error?.message) {
    throw new Error(data.error.message);
  }
  return data;
}

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}[character] || character));

function localWebsite(params: WebsiteParams): string {
  const title = escapeHtml(params.businessName);
  const description = escapeHtml(params.description);
  const owner = escapeHtml(params.userName);
  const email = escapeHtml(params.userEmail);
  const phone = escapeHtml(params.userPhone);
  const modification = params.modificationPrompt
    ? `<p class="note"><strong>Requested update:</strong> ${escapeHtml(params.modificationPrompt)}</p>`
    : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>
body{margin:0;font-family:system-ui,sans-serif;color:#183028;background:#f6fff4}main{max-width:900px;margin:auto;padding:64px 24px}
section{background:white;padding:40px;border-radius:20px;box-shadow:0 12px 40px #18302818}h1{font-size:clamp(2.5rem,8vw,5rem);margin:0;color:#166534}
p{font-size:1.1rem;line-height:1.7}.contact{margin-top:32px;padding-top:24px;border-top:1px solid #d1fae5}.note{background:#ecfccb;padding:16px;border-radius:12px}
a{color:#166534}</style></head><body><main><section><p>Welcome to</p><h1>${title}</h1><p>${description}</p>${modification}
<div class="contact"><strong>${owner}</strong><br><a href="mailto:${email}">${email}</a><br><a href="tel:${phone}">${phone}</a></div>
</section></main></body></html>`;
}

export async function generateWebsite(
  { description, userName, businessName, userEmail, userPhone, paletteName, paletteDetails, modificationPrompt }: WebsiteParams
): Promise<string> {
  if (loadPrivacyPreference()?.mode === 'local') {
    return localWebsite({ description, userName, businessName, userEmail, userPhone, paletteName, paletteDetails, modificationPrompt });
  }
  const modificationSection = modificationPrompt
    ? `\n**Modification Request:** "${modificationPrompt}"`
    : '';

  const textPrompt = PROMPT_TEMPLATE
    .replace('{USER_NAME}', userName)
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

export async function generateNewsletter(
  { description, businessName }: NewsletterParams
): Promise<string> {
  if (loadPrivacyPreference()?.mode === 'local') {
    return `${businessName}: Local newsletter draft\n\n${description}\n\nThank you for supporting our business.`;
  }
  const finalPrompt = NEWSLETTER_PROMPT_TEMPLATE
    .replace('{BUSINESS_NAME}', businessName)
    .replace('{USER_INPUT}', description);

  const data = await callAiGateway('newsletter', { prompt: finalPrompt });
  return cleanResponse(data.html || data.text || '');
}

export async function analyzeAndTranslateDashboard(
  { dashboardData, language }: DashboardAnalysisParams
): Promise<string> {
  if (loadPrivacyPreference()?.mode === 'local') {
    const langDetails = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
    return `Local summary (${langDetails.label}): Your dashboard data is available only in this browser. ${dashboardData.replace(/\s+/g, ' ').trim()}`;
  }
  const langDetails = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
  const finalPrompt = DASHBOARD_ANALYSIS_PROMPT_TEMPLATE
    .replace('{DASHBOARD_DATA}', dashboardData)
    .replace('{LANGUAGE_NAME}', langDetails.label)
    .replace('{LANGUAGE_CODE}', langDetails.value);

  const data = await callAiGateway('analysis', { prompt: finalPrompt });
  return cleanResponse(data.html || data.text || '');
}
