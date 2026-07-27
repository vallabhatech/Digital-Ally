/**
 * Base Application Error class for server-side error hierarchy.
 * All operational and business logic errors inherit from this base class.
 */
export class ApplicationError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from system/code crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request / Validation Error
 */
export class ValidationError extends ApplicationError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized: Authentication required', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends ApplicationError {
  constructor(message = 'Forbidden: Access denied', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 428 Precondition Required / Consent Missing Error
 */
export class ConsentRequiredError extends ApplicationError {
  constructor(message = 'Current AI processing consent is required', details = null) {
    super(message, 428, 'CONSENT_REQUIRED', details);
  }
}

/**
 * 429 Rate Limit Exceeded Error
 */
export class RateLimitError extends ApplicationError {
  constructor(message = 'Rate limit exceeded', retryAfter = 900, details = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter, ...details });
  }
}

/**
 * 429 Quota Exceeded Error
 */
export class QuotaExceededError extends ApplicationError {
  constructor(message = 'Quota limit exceeded', retryAfter = 86400, details = null) {
    super(message, 429, 'QUOTA_EXCEEDED', { retryAfter, ...details });
  }
}

/**
 * 502 / 503 External Service Error (e.g. Gemini API failure)
 */
export class ExternalServiceError extends ApplicationError {
  constructor(message = 'External service error', statusCode = 503, details = null) {
    super(message, statusCode, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ApplicationError {
  constructor(message = 'Internal server error', details = null) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}
