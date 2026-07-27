import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockRedisStatus = 'ready';
const mockRedisInstance = {
  get status() { return mockRedisStatus; },
  set status(v) { mockRedisStatus = v; },
  on: vi.fn(),
  quit: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  pipeline: vi.fn(() => ({
    incr: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockResolvedValue([[null, 1], [null, 1]]),
  })),
  scan: vi.fn().mockResolvedValue(['0', ['key1', 'key2']]),
  del: vi.fn().mockResolvedValue(2),
};

vi.mock('ioredis', () => {
  return {
    default: vi.fn(function MockRedisConstructor() {
      return mockRedisInstance;
    }),
  };
});

describe('db.js', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedisStatus = 'ready';
    mockRedisInstance.get = vi.fn().mockResolvedValue(null);
    mockRedisInstance.set = vi.fn().mockResolvedValue('OK');
    mockRedisInstance.del = vi.fn().mockResolvedValue(2);
  });

  it('safeGet returns null when Redis is not ready', async () => {
    const { getRedis, safeGet } = await import('./db.js');
    getRedis().status = 'not ready';
    const result = await safeGet('test-key');
    expect(result).toBeNull();
  });

  it('safeGet returns cached value when available', async () => {
    const { getRedis, safeGet } = await import('./db.js');
    getRedis().get = vi.fn().mockResolvedValue('cached-value');
    const result = await safeGet('test-key');
    expect(result).toBe('cached-value');
  });

  it('safeGet returns null on error', async () => {
    const { getRedis, safeGet } = await import('./db.js');
    getRedis().get = vi.fn().mockRejectedValue(new Error('Connection lost'));
    const result = await safeGet('test-key');
    expect(result).toBeNull();
  });

  it('safeSet returns true on success', async () => {
    const { safeSet } = await import('./db.js');
    const result = await safeSet('key', 'value', 3600);
    expect(result).toBe(true);
  });

  it('safeSet returns false on error', async () => {
    const { getRedis, safeSet } = await import('./db.js');
    getRedis().set = vi.fn().mockRejectedValue(new Error('Write failed'));
    const result = await safeSet('key', 'value', 3600);
    expect(result).toBe(false);
  });

  it('safePipeline executes commands in order', async () => {
    const { safePipeline } = await import('./db.js');
    const results = await safePipeline([
      ['incr', 'counter'],
      ['expire', 'counter', 3600],
    ]);
    expect(results).toBeDefined();
    expect(results[0][1]).toBe(1);
  });

  it('safeScan returns matching keys', async () => {
    const { safeScan } = await import('./db.js');
    const keys = await safeScan('quota:daily:*');
    expect(Array.isArray(keys)).toBe(true);
  });

  it('safeDel returns count of deleted keys', async () => {
    const { safeDel } = await import('./db.js');
    const count = await safeDel('key1', 'key2');
    expect(count).toBe(2);
  });

  it('safeDel returns 0 when Redis not ready', async () => {
    const { getRedis, safeDel } = await import('./db.js');
    getRedis().status = 'not ready';
    const count = await safeDel('key1');
    expect(count).toBe(0);
  });

  it('getMetrics returns operation counts', async () => {
    const { safeGet, getMetrics } = await import('./db.js');
    await safeGet('key-a').catch(() => {});
    await safeGet('key-b').catch(() => {});
    const metrics = getMetrics();
    expect(metrics).toHaveProperty('operations');
    expect(metrics).toHaveProperty('errors');
    expect(metrics).toHaveProperty('cacheHits');
    expect(metrics).toHaveProperty('cacheMisses');
    expect(metrics).toHaveProperty('totalLatencyMs');
  });
});
