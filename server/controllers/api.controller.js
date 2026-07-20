import crypto from 'crypto';
import { callGemini, checkGeminiHealth } from '../services/gemini.service.js';
import { AI_TASKS, getPublicConfig } from '../config.js';
import { serverPromptSchema, serverNewsletterSchema, serverAnalysisSchema, logQuerySchema, auditQuerySchema, abuseReportSchema } from '../validation/schemas.js';
import { AppError } from '../utils/AppError.js';
import { queryRequestLogs } from '../logQuery.js';
import { queryAuditLog } from '../auditLog.js';
import { requestLog, blockedIPs, ipErrorCounts, addAbuseReport } from '../services/logStore.js';
import { redis } from '../utils/redis.js';
import { cacheService } from '../services/cache.service.js';
import { isValidUUID } from '../middleware/rateLimit.js';
import { env } from '../env.js';

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

async function handleWebsiteGeneration(req, res, next) {
  try {
    const { prompt, outputFormat = 'html' } = req.validatedBody ?? req.body;
    let cleanedPrompt = stripNonPrintable(prompt);

    if (hasSpamPatterns(cleanedPrompt)) {
      return next(new AppError(400, 'SPAM_DETECTED', 'Prompt contains repeated patterns indicating spam'));
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
    next(err);
  }
}

async function handleNewsletterGeneration(req, res, next) {
  try {
    const { prompt } = req.validatedBody ?? req.body;
    const result = await callGemini('newsletter', prompt);
    attachGenerationMeta(res, result);
    return res.json({ text: result.text });
  } catch (err) {
    next(err);
  }
}

async function handleAnalysisGeneration(req, res, next) {
  try {
    const { prompt } = req.validatedBody ?? req.body;
    const result = await callGemini('analysis', prompt);
    attachGenerationMeta(res, result);
    return res.json({ text: result.text });
  } catch (err) {
    next(err);
  }
}

export async function handleCentralizedAiGenerate(req, res, next) {
  const { task, prompt, outputFormat = 'html' } = req.body ?? {};

  if (!task || !AI_TASKS.includes(task)) {
    return next(new AppError(400, 'INVALID_TASK', `Task must be one of: ${AI_TASKS.join(', ')}`));
  }
  if (!prompt || typeof prompt !== 'string') {
    return next(new AppError(400, 'INVALID_PROMPT', 'Prompt is required'));
  }

  req.body = { prompt, outputFormat };

  if (task === 'website') {
    const validation = serverPromptSchema.safeParse({ prompt, outputFormat });
    if (!validation.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid request'));
    }
    req.validatedBody = validation.data;
    return handleWebsiteGeneration(req, res, next);
  }

  if (task === 'newsletter') {
    const validation = serverNewsletterSchema.safeParse({ prompt });
    if (!validation.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid request'));
    }
    req.validatedBody = validation.data;
    return handleNewsletterGeneration(req, res, next);
  }

  const validation = serverAnalysisSchema.safeParse({ prompt });
  if (!validation.success) {
    return next(new AppError(400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid request'));
  }
  req.validatedBody = validation.data;
  return handleAnalysisGeneration(req, res, next);
}

export async function handleHealth(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
}

export function handleConfig(req, res) {
  return res.status(200).json({
    data: getPublicConfig(),
    meta: null,
    error: null,
  });
}

export async function handleUsage(req, res, next) {
  try {
    const clientId = req.get('X-Client-ID');
    if (!clientId || !isValidUUID(clientId)) {
      return next(new AppError(400, 'INVALID_REQUEST', 'Missing or invalid X-Client-ID header'));
    }
    if (!cacheService.isReady()) {
      return next(new AppError(503, 'SERVICE_UNAVAILABLE', 'Quota service unavailable'));
    }

    const today = new Date().toISOString().split('T')[0];
    const monthKey = new Date().toISOString().slice(0, 7);
    const [dailyVal, monthlyVal] = await Promise.all([
      cacheService.get(`quota:daily:${clientId}:${today}`),
      cacheService.get(`quota:monthly:${clientId}:${monthKey}`),
    ]);

    const serverConfig = getPublicConfig();
    return res.json({
      requestsToday: parseInt(dailyVal || '0', 10),
      dailyCap: env.DAILY_QUOTA,
      monthlyUsage: parseInt(monthlyVal || '0', 10),
      monthlyCap: env.MONTHLY_QUOTA,
    });
  } catch (err) {
    next(err);
  }
}

export function handleLogs(req, res, next) {
  try {
    const logQuery = queryRequestLogs(requestLog, req.validatedQuery ?? req.query);
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
    next(new AppError(400, 'INVALID_REQUEST', error.message));
  }
}

export function handleAudit(req, res, next) {
  try {
    const queryParams = req.validatedQuery ?? req.query;
    const audit = queryAuditLog({
      limit: Number.parseInt(queryParams.limit || '100', 10),
      task: queryParams.task,
      statusCode: queryParams.statusCode ? Number.parseInt(queryParams.statusCode, 10) : undefined,
      since: queryParams.since,
      until: queryParams.until,
    });
    return res.status(200).json({
      data: audit,
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export function handleAbuseReport(req, res, next) {
  try {
    const validation = abuseReportSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', validation.error.issues[0]?.message || 'Invalid abuse report'));
    }
    const report = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      reporterIp: req.ip,
      ...validation.data
    };
    addAbuseReport(report);
    return res.status(201).json({ success: true, id: report.id });
  } catch (err) {
    next(err);
  }
}
