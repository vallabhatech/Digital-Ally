import { describe, it, expect, vi } from 'vitest';
import { AI_TASKS } from './config.js';

vi.mock('./env.js', () => ({
  env: {
    GEMINI_MODEL: 'gemini-test',
    GEMINI_MODEL_WEBSITE: 'gemini-website',
    GEMINI_MODEL_NEWSLETTER: 'gemini-test',
    GEMINI_MODEL_ANALYSIS: 'gemini-test',
    DAILY_QUOTA: 25,
    MONTHLY_QUOTA: 100,
  }
}));

import { getServerConfig, getModelForTask, getPublicConfig } from './config.js';

describe('server config', () => {

  it('exposes per-task model selection', () => {
    expect(getModelForTask('website')).toBe('gemini-website');
    expect(getModelForTask('newsletter')).toBe('gemini-test');
  });

  it('returns public config without secrets', () => {
    const pub = getPublicConfig();
    expect(pub.models.website).toBe('gemini-website');
    expect(pub.quotas.daily).toBe(25);
    expect(pub.tasks).toEqual(AI_TASKS);
    expect(pub).not.toHaveProperty('apiKey');
  });
});
