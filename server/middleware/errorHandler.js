/* eslint-disable no-unused-vars */
import { ApplicationError } from '../errors/appErrors.js';

/**
 * Centralized Express Error Handling Middleware.
 * Catches all operational and unexpected errors passed via next(err).
 * Standardizes API JSON response schema:
 * {
 *   data: null,
 *   meta: null,
 *   error: { code: string, message: string, details?: object }
 * }
 */
export function errorHandler(err, req, res, next) {
  const isAppError = err instanceof ApplicationError;

  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const details = isAppError ? err.details : null;

  // Log error telemetry
  if (!isAppError || statusCode >= 500) {
    console.error(
      `[SERVER_ERROR] [${req.method} ${req.path}] ${statusCode} - ${code}: ${message}`,
      err.stack || err
    );
  } else {
    console.warn(
      `[OPERATIONAL_ERROR] [${req.method} ${req.path}] ${statusCode} - ${code}: ${message}`
    );
  }

  // Set Retry-After header if present in details
  if (details?.retryAfter) {
    res.set('Retry-After', String(details.retryAfter));
  }

  return res.status(statusCode).json({
    data: null,
    meta: null,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
