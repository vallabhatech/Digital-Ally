import { redis } from '../utils/redis.js';
import { logger } from '../logger.js';

class CacheService {
  isReady() {
    return redis && redis.status === 'ready';
  }

  async get(key) {
    if (!this.isReady()) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.isReady()) return false;
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, stringValue);
      } else {
        await redis.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for ${key}: ${error.message}`);
      return false;
    }
  }

  async del(key) {
    if (!this.isReady()) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache del error for ${key}: ${error.message}`);
      return false;
    }
  }

  async increment(key, ttlSeconds) {
    if (!this.isReady()) return null;
    try {
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      if (ttlSeconds) {
        pipeline.expire(key, ttlSeconds);
      }
      const results = await pipeline.exec();
      if (!results) return null;
      return results[0][1];
    } catch (error) {
      logger.error(`Cache increment error for ${key}: ${error.message}`);
      return null;
    }
  }
}

export const cacheService = new CacheService();
