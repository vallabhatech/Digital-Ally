/**
 * Server-managed configuration for AI models, generation params, and quotas.
 * Secrets (GEMINI_API_KEY) stay in environment variables and are never exposed to clients.
 */
import { env } from './env.js';

const AI_TASKS = ['website', 'newsletter', 'analysis'];

export function getServerConfig() {
  const defaultModel = env.GEMINI_MODEL;

  return {
    models: {
      website: env.GEMINI_MODEL_WEBSITE || defaultModel,
      newsletter: env.GEMINI_MODEL_NEWSLETTER || defaultModel,
      analysis: env.GEMINI_MODEL_ANALYSIS || defaultModel,
    },
    generation: {
      temperature: env.GEMINI_TEMPERATURE,
      topP: env.GEMINI_TOP_P,
    },
    quotas: {
      daily: env.DAILY_QUOTA,
      monthly: env.MONTHLY_QUOTA,
    },
    consentVersion: env.AI_CONSENT_VERSION,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
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
