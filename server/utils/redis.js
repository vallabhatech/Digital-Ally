import Redis from 'ioredis';
import { env } from '../env.js';
import { logger } from '../logger.js';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  logger.warn(`Redis connection error: ${err.message}`);
});
