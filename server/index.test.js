import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateContentMock = vi.fn();

vi.mock('./genaiClient.js', () => {
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

const mockRedisInstance = {
  status: 'ready',
  on: vi.fn(),
  quit: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  pipeline: vi.fn(() => ({
    incr: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockResolvedValue([[null, 1], [null, 1], [null, 1], [null, 1]]),
  })),
  scan: vi.fn().mockResolvedValue(['0', []]),
  del: vi.fn().mockResolvedValue(0),
};

vi.mock('./db.js', () => {
  const actual = {};
  return {
    getRedis: () => mockRedisInstance,
    getMetrics: () => ({ operations: 0, errors: 0, cacheHits: 0, cacheMisses: 0, totalLatencyMs: 0, lastError: null }),
    safeGet: vi.fn().mockResolvedValue(null),
    safeSet: vi.fn().mockResolvedValue(true),
    safePipeline: vi.fn().mockResolvedValue([[null, 1], [null, 1], [null, 1], [null, 1]]),
    safeScan: vi.fn().mockResolvedValue([]),
    safeDel: vi.fn().mockResolvedValue(0),
    safeQuit: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('./ringBuffer.js', () => {
  class MockRingBuffer {
    constructor(maxSize) {
      this.maxSize = maxSize;
      this._data = [];
    }
    push(item) { this._data.push(item); if (this._data.length > this.maxSize) this._data.shift(); }
    toArray() { return [...this._data]; }
    get length() { return this._data.length; }
    forEach(fn) { this._data.forEach(fn); }
    filter(fn) { return this._data.filter(fn); }
    clear() { this._data = []; }
  }
  return { RingBuffer: MockRingBuffer };
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
  queryRequestLogs: vi.fn(() => ({
    entries: [],
    total: 0,
    returned: 0,
    limit: 100,
    pagination: {},
    filters: {},
    sort: {},
  })),
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

  it('includes db metrics in health response', async () => {
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
    expect(res.body).toHaveProperty('db');
    expect(res.body.db).toHaveProperty('operations');
    expect(res.body.db).toHaveProperty('cacheHits');
  });
});
