import winston from 'winston';
import { recordAuditEvent } from './auditLog.js';
import { env } from './env.js';

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

/**
 * Structured JSON logger middleware for AI gateway routes.
 * Logs request metadata and response size to the winston logger and the in-memory audit log.
 */
export function createLogger({ taskResolver } = {}) {
  return (req, res, next) => {
    const startTime = Date.now();
    let logged = false;

    const logRequest = () => {
      if (logged) return;
      logged = true;

      const durationMs = Date.now() - startTime;
      const clientId = req.get('X-Client-ID') || null;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const endpoint = req.path;
      const promptLength = req.body?.prompt?.length || 0;
      const statusCode = res.statusCode;
      const task = taskResolver?.(req) || req.body?.task || 'unknown';
      const responseSizeBytes = res.locals?.responseSizeBytes ?? 0;
      const model = res.locals?.modelUsed || null;
      const success = statusCode >= 200 && statusCode < 400;

      const logEntry = {
        event: success ? 'ai.request' : 'ai.failure',
        ip,
        clientId,
        endpoint,
        task,
        promptLength,
        responseSizeBytes,
        model,
        statusCode,
        durationMs,
        consentVersion: req.get('X-AI-Consent') || null,
        quota: req.quotaInfo || null,
      };

      if (success) {
        logger.info('AI Request Successful', logEntry);
      } else {
        logger.warn('AI Request Failed', logEntry);
      }
      
      recordAuditEvent(logEntry);
    };

    res.on('finish', logRequest);
    res.on('close', logRequest);
    next();
  };
}
