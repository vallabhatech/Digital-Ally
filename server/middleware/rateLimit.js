import rateLimit from 'express-rate-limit';
import { getServerConfig } from '../config.js';
import { cacheService } from '../services/cache.service.js';
import { env } from '../env.js';
import { logger } from '../logger.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(str) {
  return UUID_REGEX.test(str);
}

export function getClientIdentifier(req) {
  const clientId = req.get('X-Client-ID');
  if (clientId && isValidUUID(clientId)) return clientId;
  return req.ip || req.connection.remoteAddress || 'unknown';
}

const serverConfig = getServerConfig();
const DAILY_QUOTA = serverConfig.quotas.daily;
const MONTHLY_QUOTA = serverConfig.quotas.monthly;
const DAILY_TTL = 86400;
const MONTHLY_TTL = 30 * 24 * 60 * 60;

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
});

export const generateLimiter = rateLimit({
  windowMs: serverConfig.rateLimit.windowMs,
  max: serverConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIdentifier,
  handler: (req, res) => {
    const retryAfter = req.rateLimit.resetTime
      ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      : Math.ceil(serverConfig.rateLimit.windowMs / 1000);
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter });
  },
});

export async function quotaMiddleware(req, res, next) {
  try {
    const adminToken = req.get('X-Admin-Token');
    if (adminToken && adminToken === env.ADMIN_TOKEN) return next();

    let quotaKey = req.get('X-Client-ID');
    if (!quotaKey || !isValidUUID(quotaKey)) {
      quotaKey = req.ip || req.connection.remoteAddress || 'unknown';
    }

    if (!cacheService.isReady()) {
      logger.warn('Redis not ready, skipping quota check');
      return next();
    }

    const today = new Date().toISOString().split('T')[0];
    const monthKey = new Date().toISOString().slice(0, 7);
    const dailyKey = `quota:daily:${quotaKey}:${today}`;
    const monthlyKey = `quota:monthly:${quotaKey}:${monthKey}`;

    const dailyIncr = await cacheService.increment(dailyKey, DAILY_TTL);
    const monthlyIncr = await cacheService.increment(monthlyKey, MONTHLY_TTL);

    if (dailyIncr === null || monthlyIncr === null) {
      return next(); // Fail open if cache fails
    }

    if (dailyIncr > DAILY_QUOTA) {
      return res.status(429).set('Retry-After', String(DAILY_TTL)).json({
        error: 'Daily quota exceeded',
        quotaLimit: DAILY_QUOTA,
        quotaUsed: dailyIncr,
        retryAfter: DAILY_TTL,
      });
    }

    if (monthlyIncr > MONTHLY_QUOTA) {
      return res.status(429).set('Retry-After', String(MONTHLY_TTL)).json({
        error: 'Monthly quota exceeded',
        quotaLimit: MONTHLY_QUOTA,
        quotaUsed: monthlyIncr,
        retryAfter: MONTHLY_TTL,
      });
    }

    req.quotaInfo = {
      daily: { used: dailyIncr, limit: DAILY_QUOTA },
      monthly: { used: monthlyIncr, limit: MONTHLY_QUOTA },
      quotaKey,
    };

    res.set('X-RateLimit-Daily-Limit', String(DAILY_QUOTA));
    res.set('X-RateLimit-Daily-Remaining', String(Math.max(0, DAILY_QUOTA - dailyIncr)));
    res.set('X-RateLimit-Monthly-Limit', String(MONTHLY_QUOTA));
    res.set('X-RateLimit-Monthly-Remaining', String(Math.max(0, MONTHLY_QUOTA - monthlyIncr)));
    next();
  } catch (error) {
    logger.error('Error in quota middleware: ' + error.message);
    next();
  }
}
