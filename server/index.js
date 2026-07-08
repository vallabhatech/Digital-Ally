import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import Redis from 'ioredis';
import cron from 'node-cron';
import { createLogger } from './logger.js';
import { queryRequestLogs } from './logQuery.js';
import { validateBody } from './validation/middleware.js';
import {
  serverPromptSchema,
  serverNewsletterSchema,
  serverAnalysisSchema,
} from './validation/schemas.js';
import { getServerConfig, getModelForTask, getPublicConfig, AI_TASKS } from './config.js';
import { queryAuditLog } from './auditLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();

function sendSuccess(res, statusCode, data, meta = null) {
  return res.status(statusCode).json({
    data: data ?? null,
    meta: meta ?? null,
    error: null,
  });
}

function sendError(res, statusCode, code, message, details = null, meta = null) {
  return res.status(statusCode).json({
    data: null,
    meta: meta ?? null,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

const PORT = process.env.PORT || 5174;

const hasGeminiApiKey = Boolean(process.env.GEMINI_API_KEY);
if (!hasGeminiApiKey) {
  console.warn('GEMINI_API_KEY not set in server environment. Health checks will report the server as misconfigured.');
}

const SERVER_CLIENT_TOKEN = process.env.SERVER_CLIENT_TOKEN || null;
if (!SERVER_CLIENT_TOKEN) {
  console.warn(
    'WARNING: SERVER_CLIENT_TOKEN not set. Requests without Authorization will be rejected.'
  );
}

let ai = null;
function getGeminiClient() {
  if (ai) return ai;
  if (!process.env.GEMINI_API_KEY) return null;
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
}

const serverConfig = getServerConfig();
const CONSENT_VERSION = serverConfig.consentVersion;
const API_VERSION = 'v1';
const API_DEPRECATION_SUNSET = 'Wed, 31 Dec 2026 23:59:59 GMT';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  console.warn('Redis connection error:', err.message);
  console.warn('Rate limiting quotas will be unavailable.');
});

redis.on('connect', () => {
  console.log('Connected to Redis for quota tracking');
});

cron.schedule(
  '0 0 * * *',
  async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const pattern = `quota:daily:*:${yesterday}`;
      const keys = await redis.keys(pattern);
      if (keys?.length) {
        await redis.del(...keys);
        console.log(`Cleared ${keys.length} daily quota keys for ${yesterday}`);
      }
    } catch (err) {
      console.error('Error during scheduled daily quota reset:', err);
    }
  },
  { timezone: 'UTC' }
);

const MAX_LOG_ENTRIES = 1000;
const ERROR_THRESHOLD = 5;
const ERROR_WINDOW = 10 * 60 * 1000;
const BLOCK_DURATION = 60 * 60 * 1000;

const requestLog = [];
const ipErrorCounts = new Map();
const blockedIPs = new Map();

function addToLog(entry) {
  requestLog.push(entry);
  if (requestLog.length > MAX_LOG_ENTRIES) requestLog.shift();
}

function trackError(ip) {
  const now = Date.now();
  if (!ipErrorCounts.has(ip)) ipErrorCounts.set(ip, []);
  const errors = ipErrorCounts.get(ip);
  errors.push(now);
  const validErrors = errors.filter((timestamp) => now - timestamp < ERROR_WINDOW);
  ipErrorCounts.set(ip, validErrors);
  if (validErrors.length > ERROR_THRESHOLD) {
    blockedIPs.set(ip, now + BLOCK_DURATION);
    console.warn(`Client ${ip} blocked for 1 hour due to ${validErrors.length} errors in 10 minutes`);
  }
  return validErrors.length;
}

function isIPBlocked(ip) {
  if (!blockedIPs.has(ip)) return false;
  const unblockTime = blockedIPs.get(ip);
  if (Date.now() > unblockTime) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return UUID_REGEX.test(str);
}

function getClientIdentifier(req) {
  const clientId = req.get('X-Client-ID');
  if (clientId && isValidUUID(clientId)) return clientId;
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function checkIPBlocklist(req, res, next) {
  const clientIdentifier = getClientIdentifier(req);
  if (isIPBlocked(clientIdentifier)) {
    return sendError(res, 403, 'IP_BLOCKED', 'Client blocked due to excessive errors');
  }
  next();
}

function requestLogger(req, res, next) {
  const clientIdentifier = getClientIdentifier(req);
  addToLog({
    ip: clientIdentifier,
    endpoint: req.path,
    timestamp: new Date().toISOString(),
    promptLength: req.body?.prompt?.length || 0,
    task: req.body?.task || null,
  });

  const originalJson = res.json;
  res.json = function (data) {
    if (res.statusCode >= 400 && res.statusCode < 600 && res.statusCode !== 429) {
      trackError(clientIdentifier);
    }
    return originalJson.call(this, data);
  };
  next();
}

app.use(checkIPBlocklist);
app.use(requestLogger);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '128kb' }));

app.use(['/api/generate/', `/api/${API_VERSION}/generate/`, `/api/${API_VERSION}/ai/`], (req, res, next) => {
  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  next();
});

app.use(
  '/api/',
  rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

function setApiVersionHeader(req, res, next) {
  res.set('API-Version', API_VERSION);
  next();
}

function setDeprecatedApiHeaders(successorPath) {
  return (req, res, next) => {
    res.set('API-Version', API_VERSION);
    res.set('Deprecation', 'true');
    res.set('Sunset', API_DEPRECATION_SUNSET);
    res.set('Link', `<${successorPath}>; rel="successor-version"`);
    next();
  };
}

app.use(`/api/${API_VERSION}`, setApiVersionHeader);
app.use(
  ['/api/generate/', '/api/health', '/api/usage', '/api/logs', '/api/audit'],
  setDeprecatedApiHeaders(`/api/${API_VERSION}`)
);

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }
  if (parts[1] !== SERVER_CLIENT_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  next();
}

function requireAdmin(req, res, next) {
  const adminToken = req.get('X-Admin-Token');
  if (!process.env.ADMIN_TOKEN || adminToken !== process.env.ADMIN_TOKEN) {
    return sendError(res, 403, 'FORBIDDEN', 'Admin token required');
  }
  next();
}

function requireAiConsent(req, res, next) {
  if (req.get('X-AI-Consent') !== CONSENT_VERSION) {
    return res.status(428).json({ error: 'Current AI processing consent is required' });
  }
  next();
}

app.use(['/api/generate/', `/api/${API_VERSION}/generate/`, `/api/${API_VERSION}/ai/`], requireAuth);

const generateLimiter = rateLimit({
  windowMs: serverConfig.rateLimit.windowMs,
  max: serverConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = req.rateLimit.resetTime
      ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
      : Math.ceil(serverConfig.rateLimit.windowMs / 1000);
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter });
  },
});

const generateLogger = createLogger();
const DAILY_QUOTA = serverConfig.quotas.daily;
const MONTHLY_QUOTA = serverConfig.quotas.monthly;
const DAILY_TTL = 86400;
const MONTHLY_TTL = 30 * 24 * 60 * 60;

async function quotaMiddleware(req, res, next) {
  try {
    const adminToken = req.get('X-Admin-Token');
    if (adminToken && adminToken === process.env.ADMIN_TOKEN) return next();

    let quotaKey = req.get('X-Client-ID');
    if (!quotaKey || !isValidUUID(quotaKey)) {
      quotaKey = req.ip || req.connection.remoteAddress || 'unknown';
    }

    if (redis.status !== 'ready') {
      console.warn('Redis not ready, skipping quota check');
      return next();
    }

    const today = new Date().toISOString().split('T')[0];
    const monthKey = new Date().toISOString().slice(0, 7);
    const dailyKey = `quota:daily:${quotaKey}:${today}`;
    const monthlyKey = `quota:monthly:${quotaKey}:${monthKey}`;

    const pipeline = redis.pipeline();
    pipeline.incr(dailyKey);
    pipeline.expire(dailyKey, DAILY_TTL);
    pipeline.incr(monthlyKey);
    pipeline.expire(monthlyKey, MONTHLY_TTL);
    const results = await pipeline.exec();
    if (!results) return next();

    const dailyIncr = results[0][1];
    const monthlyIncr = results[2][1];

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

    res.set('X-RateLimit-Daily-Limit', DAILY_QUOTA);
    res.set('X-RateLimit-Daily-Remaining', Math.max(0, DAILY_QUOTA - dailyIncr));
    res.set('X-RateLimit-Monthly-Limit', MONTHLY_QUOTA);
    res.set('X-RateLimit-Monthly-Remaining', Math.max(0, MONTHLY_QUOTA - monthlyIncr));
    next();
  } catch (error) {
    console.error('Error in quota middleware:', error);
    next();
  }
}

app.use('/api/', quotaMiddleware);

const aiRouteMiddleware = [
  generateLimiter,
  requireAiConsent,
  generateLogger,
];

async function callGemini(task, prompt) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API is not configured on the server.');
  }

  const config = getServerConfig();
  const model = getModelForTask(task);
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: config.generation.temperature,
      topP: config.generation.topP,
    },
  });
  const text = response.text || '';
  return { text, model, responseSizeBytes: Buffer.byteLength(text, 'utf8') };
}

function stripNonPrintable(str) {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function hasSpamPatterns(str) {
  const words = str.toLowerCase().split(/\s+/);
  const wordCounts = new Map();
  for (const word of words) {
    if (!word.length) continue;
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    if (wordCounts.get(word) > 20) return true;
  }
  return false;
}

function attachGenerationMeta(res, result) {
  res.locals.modelUsed = result.model;
  res.locals.responseSizeBytes = result.responseSizeBytes;
}

async function handleWebsiteGeneration(req, res) {
  try {
    const { prompt, outputFormat = 'html' } = req.validatedBody ?? req.body;
    let cleanedPrompt = stripNonPrintable(prompt);

    if (hasSpamPatterns(cleanedPrompt)) {
      return sendError(res, 400, 'SPAM_DETECTED', 'Prompt contains repeated patterns indicating spam');
    }

    let geminiPrompt = cleanedPrompt;
    if (outputFormat === 'react') {
      geminiPrompt = `Generate a React functional component based on the following description. Ensure the component is self-contained and uses standard React practices. Only return the JSX/TSX code, no extra explanations or markdown formatting outside the component itself:\n\n${cleanedPrompt}`;
    } else if (outputFormat === 'html') {
      geminiPrompt = `Generate a complete HTML page based on the following description. Only return the HTML code, no extra explanations or markdown formatting outside the HTML itself:\n\n${cleanedPrompt}`;
    } else if (outputFormat === 'zip') {
      geminiPrompt = `Generate a complete website (HTML, CSS, and JS) based on: ${cleanedPrompt}. 
      Return the result ONLY as a valid JSON object where keys are filenames and values are the file contents.
      Example format: {"index.html": "...", "styles.css": "...", "script.js": "..."}
      Do not include any explanations or markdown formatting.`;
    }

    const result = await callGemini('website', geminiPrompt);
    attachGenerationMeta(res, result);
    const generatedContent = result.text;

    if (outputFormat === 'zip') {
      try {
        const cleanedContent = generatedContent.replace(/```json|```/g, '').trim();
        const files = JSON.parse(cleanedContent);
        return res.json({ zip: files });
      } catch {
        return res.json({ zip: generatedContent, warning: 'Parsed as raw text' });
      }
    }

    return res.json({ [outputFormat]: generatedContent.trim() });
  } catch (err) {
    console.error('Website generation failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function handleNewsletterGeneration(req, res) {
  try {
    const { prompt } = req.validatedBody ?? req.body;
    const result = await callGemini('newsletter', prompt);
    attachGenerationMeta(res, result);
    return res.json({ text: result.text });
  } catch (err) {
    console.error('Newsletter generation failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function handleAnalysisGeneration(req, res) {
  try {
    const { prompt } = req.validatedBody ?? req.body;
    const result = await callGemini('analysis', prompt);
    attachGenerationMeta(res, result);
    return res.json({ text: result.text });
  } catch (err) {
    console.error('Dashboard analysis failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function handleCentralizedAiGenerate(req, res) {
  const { task, prompt, outputFormat = 'html' } = req.body ?? {};

  if (!task || !AI_TASKS.includes(task)) {
    return sendError(res, 400, 'INVALID_TASK', `Task must be one of: ${AI_TASKS.join(', ')}`);
  }
  if (!prompt || typeof prompt !== 'string') {
    return sendError(res, 400, 'INVALID_PROMPT', 'Prompt is required');
  }

  req.body = { prompt, outputFormat };

  if (task === 'website') {
    const validation = serverPromptSchema.safeParse({ prompt, outputFormat });
    if (!validation.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid request');
    }
    req.validatedBody = validation.data;
    return handleWebsiteGeneration(req, res);
  }

  if (task === 'newsletter') {
    const validation = serverNewsletterSchema.safeParse({ prompt });
    if (!validation.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid request');
    }
    req.validatedBody = validation.data;
    return handleNewsletterGeneration(req, res);
  }

  const validation = serverAnalysisSchema.safeParse({ prompt });
  if (!validation.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid request');
  }
  req.validatedBody = validation.data;
  return handleAnalysisGeneration(req, res);
}

async function checkGeminiHealth() {
  const client = getGeminiClient();
  if (!process.env.GEMINI_API_KEY || !client) {
    return {
      ok: false,
      configured: false,
      reachable: false,
      message: 'Gemini API key is not configured on the server.',
    };
  }

  try {
    const model = getModelForTask('website');
    await client.models.generateContent({
      model,
      contents: 'health check',
      config: {
        temperature: 0,
        topP: 0,
      },
    });

    return {
      ok: true,
      configured: true,
      reachable: true,
      message: 'Gemini API is reachable.',
      model,
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      reachable: false,
      message: error instanceof Error ? error.message : 'Gemini API is unreachable.',
    };
  }
}

async function handleHealth(req, res) {
  const gemini = await checkGeminiHealth();
  return res.status(gemini.ok ? 200 : 503).json({
    ok: gemini.ok,
    redis: redis.status,
    gemini: {
      configured: gemini.configured,
      reachable: gemini.reachable,
      message: gemini.message,
      model: gemini.model || null,
    },
  });
}

function handleConfig(req, res) {
  return sendSuccess(res, 200, getPublicConfig());
}

async function handleUsage(req, res) {
  try {
    const clientId = req.get('X-Client-ID');
    if (!clientId || !isValidUUID(clientId)) {
      return res.status(400).json({ error: 'Missing or invalid X-Client-ID header' });
    }
    if (redis.status !== 'ready') {
      return res.status(503).json({ error: 'Quota service unavailable' });
    }

    const today = new Date().toISOString().split('T')[0];
    const monthKey = new Date().toISOString().slice(0, 7);
    const [dailyVal, monthlyVal] = await Promise.all([
      redis.get(`quota:daily:${clientId}:${today}`),
      redis.get(`quota:monthly:${clientId}:${monthKey}`),
    ]);

    return res.json({
      requestsToday: parseInt(dailyVal || '0', 10),
      dailyCap: DAILY_QUOTA,
      monthlyUsage: parseInt(monthlyVal || '0', 10),
      monthlyCap: MONTHLY_QUOTA,
    });
  } catch (err) {
    console.error('Error in /api/usage', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function handleLogs(req, res) {
  try {
    const logQuery = queryRequestLogs(requestLog, req.query);
    return res.json({
      requestLog: logQuery.entries,
      logCount: logQuery.total,
      returned: logQuery.returned,
      limit: logQuery.limit,
      pagination: logQuery.pagination,
      filters: logQuery.filters,
      sort: logQuery.sort,
      blockedIPs: Array.from(blockedIPs.entries()).map(([ip, unblockTime]) => ({
        ip,
        unblockTime: new Date(unblockTime).toISOString(),
      })),
      errorCounts: Object.fromEntries(
        Array.from(ipErrorCounts.entries()).map(([ip, errors]) => [
          ip,
          { count: errors.length, window: '10 minutes' },
        ])
      ),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

function handleAudit(req, res) {
  const audit = queryAuditLog({
    limit: Number.parseInt(req.query.limit || '100', 10),
    task: req.query.task,
    statusCode: req.query.statusCode ? Number.parseInt(req.query.statusCode, 10) : undefined,
    since: req.query.since,
    until: req.query.until,
  });
  return sendSuccess(res, 200, audit);
}

// Centralized AI gateway (preferred)
app.post(`/api/${API_VERSION}/ai/generate`, ...aiRouteMiddleware, handleCentralizedAiGenerate);

// Legacy task-specific routes (backward compatible)
app.post(
  `/api/${API_VERSION}/generate/website`,
  ...aiRouteMiddleware,
  validateBody(serverPromptSchema),
  handleWebsiteGeneration
);
app.post(
  '/api/generate/website',
  ...aiRouteMiddleware,
  validateBody(serverPromptSchema),
  handleWebsiteGeneration
);
app.post(
  `/api/${API_VERSION}/generate/newsletter`,
  ...aiRouteMiddleware,
  validateBody(serverNewsletterSchema),
  handleNewsletterGeneration
);
app.post(
  '/api/generate/newsletter',
  ...aiRouteMiddleware,
  validateBody(serverNewsletterSchema),
  handleNewsletterGeneration
);
app.post(
  `/api/${API_VERSION}/generate/analysis`,
  ...aiRouteMiddleware,
  validateBody(serverAnalysisSchema),
  handleAnalysisGeneration
);
app.post(
  '/api/generate/analysis',
  ...aiRouteMiddleware,
  validateBody(serverAnalysisSchema),
  handleAnalysisGeneration
);

app.get(`/api/${API_VERSION}/health`, handleHealth);
app.get('/api/health', handleHealth);

app.get(`/api/${API_VERSION}/config`, requireAuth, handleConfig);
app.get('/api/config', requireAuth, handleConfig);

app.get(`/api/${API_VERSION}/usage`, handleUsage);
app.get('/api/usage', handleUsage);

app.get(`/api/${API_VERSION}/logs`, requireAdmin, handleLogs);
app.get('/api/logs', requireAdmin, handleLogs);

app.get(`/api/${API_VERSION}/audit`, requireAdmin, handleAudit);
app.get('/api/audit', requireAdmin, handleAudit);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`AI gateway listening on port ${PORT}`);
    console.log(`Models: website=${getModelForTask('website')}, newsletter=${getModelForTask('newsletter')}, analysis=${getModelForTask('analysis')}`);
  });
}

export { app, handleHealth, checkGeminiHealth };

process.on('SIGTERM', async () => {
  if (redis?.status === 'ready') await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (redis?.status === 'ready') await redis.quit();
  process.exit(0);
});
