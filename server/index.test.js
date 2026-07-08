import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    constructor() {
      this.models = {
        generateContent: generateContentMock,
      };
    }
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
  };
});

vi.mock('ioredis', () => {
  class MockRedis {
    constructor() {
      this.status = 'ready';
      this.on = vi.fn();
      this.quit = vi.fn();
      this.pipeline = vi.fn(() => ({
        incr: vi.fn(),
        expire: vi.fn(),
        exec: vi.fn().mockResolvedValue([]),
      }));
      this.keys = vi.fn().mockResolvedValue([]);
      this.del = vi.fn().mockResolvedValue(0);
    }
  }

  return {
    default: MockRedis,
  };
});

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
  },
}));

vi.mock('./logger.js', () => ({
  createLogger: () => vi.fn(),
}));

vi.mock('./logQuery.js', () => ({
  queryRequestLogs: vi.fn(() => ({ entries: [], total: 0, returned: 0, limit: 100, pagination: {}, filters: {}, sort: {} })),
}));

vi.mock('./auditLog.js', () => ({
  queryAuditLog: vi.fn(() => ({ entries: [] })),
}));

const { handleHealth } = await import('./index.js');

describe('GET /api/health', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    generateContentMock.mockReset();
  });

  it('returns healthy when the Gemini API is reachable', async () => {
    generateContentMock.mockResolvedValue({ text: 'ok' });

    const req = {};
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await handleHealth(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.gemini.reachable).toBe(true);
  });

  it('returns unhealthy when the Gemini API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    const req = {};
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await handleHealth(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.gemini.configured).toBe(false);
  });
});
