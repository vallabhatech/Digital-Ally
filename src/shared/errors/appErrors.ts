/**
 * Base Application Error class for frontend client-side error hierarchy.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details: unknown;

  constructor(message: string, code = 'APP_ERROR', details: unknown = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * API Error representing non-2xx HTTP responses from the backend gateway.
 */
export class ApiError extends AppError {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number, code = 'API_ERROR', details: unknown = null) {
    super(message, code, details);
    this.statusCode = statusCode;
  }
}

/**
 * 401 / 403 Authentication Error
 */
export class AuthAppError extends ApiError {
  constructor(message = 'Authentication required', statusCode = 401, details: unknown = null) {
    super(message, statusCode, 'UNAUTHORIZED', details);
  }
}

/**
 * 429 Rate Limit / Quota Exceeded Error
 */
export class QuotaAppError extends ApiError {
  public readonly retryAfter: number;

  constructor(message = 'Quota or rate limit exceeded', retryAfter = 900, details: unknown = null) {
    super(message, 429, 'QUOTA_EXCEEDED', details);
    this.retryAfter = retryAfter;
  }
}

/**
 * Form Validation Error
 */
export class ValidationAppError extends AppError {
  constructor(message = 'Validation failed', details: unknown = null) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Network / Connectivity Error
 */
export class NetworkAppError extends AppError {
  constructor(message = 'Unable to connect to the server', details: unknown = null) {
    super(message, 'NETWORK_ERROR', details);
  }
}
