/**
 * Server-managed configuration for AI models, generation params, and quotas.
 * Secrets (GEMINI_API_KEY) stay in environment variables and are never exposed to clients.
 */

const AI_TASKS = ['website', 'newsletter', 'analysis'];

export function getServerConfig() {
  const defaultModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  return {
    models: {
      website: process.env.GEMINI_MODEL_WEBSITE || defaultModel,
      newsletter: process.env.GEMINI_MODEL_NEWSLETTER || defaultModel,
      analysis: process.env.GEMINI_MODEL_ANALYSIS || defaultModel,
    },
    generation: {
      temperature: Number.parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
      topP: Number.parseFloat(process.env.GEMINI_TOP_P || '0.95'),
    },
    quotas: {
      daily: Number.parseInt(process.env.DAILY_QUOTA || '100', 10),
      monthly: Number.parseInt(process.env.MONTHLY_QUOTA || '1000', 10),
    },
    consentVersion: process.env.AI_CONSENT_VERSION || '2026-06-21',
    rateLimit: {
      windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
      max: Number.parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
    },
  };
}

export function getModelForTask(task) {
  const config = getServerConfig();
  return config.models[task] || config.models.website;
}

export function getPublicConfig() {
  const config = getServerConfig();
  return {
    models: config.models,
    quotas: config.quotas,
    consentVersion: config.consentVersion,
    tasks: AI_TASKS,
  };
}

export { AI_TASKS };
