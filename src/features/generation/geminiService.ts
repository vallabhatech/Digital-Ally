import { CONSENT_VERSION } from '@/shared/privacy';
import type { HealthStatus } from '@/shared/types';

const API_BASE = '/api';
const CLIENT_ID_KEY = 'digital-ally-client-id';

type RetryCallback = (attempt: number, error: Error) => void;

interface WebsiteRequest {
  formData: {
    userName: string;
    businessName: string;
    userEmail: string;
    userPhone: string;
    prompt: string;
    services: string;
    location?: string;
    themeColor: string;
    selectedPalette: string;
  };
  modificationPrompt?: string;
  onRetry?: RetryCallback;
}

interface WebsiteSuccess {
  success: true;
  code: string;
}

interface Failure {
  success: false;
  error: string;
}

interface NewsletterSuccess {
  success: true;
  newsletterText: string;
}

const toErrorMessage = (status: number, payload: unknown, fallback: string): string => {
  if (
    status === 429 &&
    typeof payload === 'object' &&
    payload !== null &&
    'retryAfter' in payload
  ) {
    const retryAfter = Number((payload as { retryAfter?: number }).retryAfter || 900);
    return `RATE_LIMIT_429|${retryAfter}`;
  }

  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const message = (payload as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

const getClientId = (): string => {
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const created = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
};

const buildHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_SERVER_CLIENT_TOKEN || ''}`,
  'X-AI-Consent': CONSENT_VERSION,
  'X-Client-ID': getClientId(),
});

const buildWebsitePrompt = (
  formData: WebsiteRequest['formData'],
  modificationPrompt?: string
): string => {
  const basePrompt = [
    `Business owner name: ${formData.userName}`,
    `Business name: ${formData.businessName}`,
    `Contact email: ${formData.userEmail}`,
    `Contact phone: ${formData.userPhone}`,
    `Business description: ${formData.prompt}`,
    `Services and products: ${formData.services}`,
    `Location: ${formData.location || 'Not specified'}`,
    `Theme color: ${formData.themeColor}`,
    `Selected palette: ${formData.selectedPalette}`,
  ].join('\n');

  if (!modificationPrompt) {
    return `${basePrompt}\n\nGenerate a complete responsive HTML page.`;
  }

  return `${basePrompt}\n\nApply this modification request to the generated website:\n${modificationPrompt}`;
};

export async function checkGeminiHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const payload = await response.json();

    return {
      ok: Boolean(payload?.ok),
      checked: true,
      retrying: false,
      message:
        typeof payload?.gemini?.message === 'string'
          ? payload.gemini.message
          : payload?.ok
            ? 'Gemini API is reachable.'
            : 'Gemini API is unavailable.',
    };
  } catch {
    return {
      ok: false,
      checked: true,
      retrying: false,
      message: 'Backend health check failed. Make sure the server is running.',
    };
  }
}

export async function generateWebsite(request: WebsiteRequest): Promise<WebsiteSuccess | Failure> {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/generate/website`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          prompt: buildWebsitePrompt(request.formData, request.modificationPrompt),
          outputFormat: 'html',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: toErrorMessage(response.status, payload, 'Website generation failed.'),
        };
      }

      const code = typeof payload?.html === 'string' ? payload.html : '';
      if (!code.trim()) {
        return { success: false, error: 'Website generation returned empty content.' };
      }

      return { success: true, code };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Website generation failed.');
      request.onRetry?.(attempt, error);
      if (attempt === maxAttempts) {
        return { success: false, error: error.message };
      }
    }
  }

  return { success: false, error: 'Website generation failed.' };
}

export async function generateNewsletter(input: {
  prompt: string;
  businessName: string;
}): Promise<NewsletterSuccess | Failure> {
  try {
    const response = await fetch(`${API_BASE}/generate/newsletter`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ prompt: `${input.businessName}: ${input.prompt}` }),
    });
    const payload = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: toErrorMessage(response.status, payload, 'Newsletter generation failed.'),
      };
    }

    return {
      success: true,
      newsletterText: typeof payload?.text === 'string' ? payload.text : '',
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Newsletter generation failed.',
    };
  }
}

export async function analyzeAndTranslateDashboard(input: {
  dashboardData: string;
  language: string;
}): Promise<string> {
  const response = await fetch(`${API_BASE}/generate/analysis`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      prompt: `Analyze this dashboard data and provide concise insights in ${input.language}:\n${input.dashboardData}`,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(toErrorMessage(response.status, payload, 'Dashboard analysis failed.'));
  }

  return typeof payload?.text === 'string' ? payload.text : '';
}
