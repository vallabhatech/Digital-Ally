import Redis from 'ioredis';

const metrics = {
  operations: 0,
  errors: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalLatencyMs: 0,
  lastError: null,
};

let redisInstance = null;

function createRedisClient() {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    commandTimeout: 5000,
  });

  client.on('error', (err) => {
    metrics.errors++;
    metrics.lastError = err.message;
    console.warn('Redis connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('Connected to Redis for quota tracking and query caching optimization');
  });

  return client;
}

export function getRedis() {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
}

export function getMetrics() {
  return { ...metrics };
}

function trackOperation(startTime) {
  metrics.operations++;
  metrics.totalLatencyMs += Date.now() - startTime;
}

export async function safeGet(key) {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status !== 'ready') return null;
    const value = await client.get(key);
    if (value !== null) metrics.cacheHits++;
    else metrics.cacheMisses++;
    return value;
  } catch (err) {
    metrics.errors++;
    metrics.lastError = err.message;
    console.warn('Redis get failed:', err.message);
    return null;
  } finally {
    trackOperation(start);
  }
}

export async function safeSet(key, value, ttl) {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status !== 'ready') return false;
    await client.set(key, value, 'EX', ttl);
    return true;
  } catch (err) {
    metrics.errors++;
    metrics.lastError = err.message;
    console.warn('Redis set failed:', err.message);
    return false;
  } finally {
    trackOperation(start);
  }
}

export async function safeIncr(key) {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status !== 'ready') return null;
    return await client.incr(key);
  } catch (err) {
    metrics.errors++;
    metrics.lastError = err.message;
    console.warn('Redis incr failed:', err.message);
    return null;
  } finally {
    trackOperation(start);
  }
}

export async function safeExpire(key, ttl) {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status !== 'ready') return false;
    return await client.expire(key, ttl);
  } catch (err) {
    metrics.errors++;
    metrics.lastError = err.message;
    return false;
  } finally {
    trackOperation(start);
  }
}

export async function safePipeline(commands) {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status !== 'ready') return null;
    const pipeline = client.pipeline();
    for (const [cmd, ...args] of commands) {
      pipeline[cmd](...args);
    }
    return await pipeline.exec();
  } catch (err) {
    metrics.errors++;
    metrics.lastError = err.message;
    return null;
  } finally {
    trackOperation(start);
  }
}

export async function safeScan(pattern, count = 100) {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status !== 'ready') return [];
    const results = [];
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      cursor = nextCursor;
      results.push(...keys);
    } while (cursor !== '0');
    return results;
  } catch (err) {
    metrics.errors++;
    metrics.lastError = err.message;
    console.warn('Redis scan failed:', err.message);
    return [];
  } finally {
    trackOperation(start);
  }
}

export async function safeDel(...keys) {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status !== 'ready') return 0;
    return await client.del(...keys);
  } catch (err) {
    metrics.errors++;
    metrics.lastError = err.message;
    return 0;
  } finally {
    trackOperation(start);
  }
}

export async function safeQuit() {
  const start = Date.now();
  try {
    const client = getRedis();
    if (client.status === 'ready') await client.quit();
  } catch (err) {
    metrics.errors++;
  } finally {
    trackOperation(start);
  }
}
