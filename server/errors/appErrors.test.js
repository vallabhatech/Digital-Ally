import { describe, expect, it } from 'vitest';
import {
  ApplicationError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConsentRequiredError,
  RateLimitError,
  QuotaExceededError,
  ExternalServiceError,
  InternalServerError,
} from './appErrors.js';

describe('Server Error Hierarchy', () => {
  it('creates ApplicationError with default properties', () => {
    const error = new ApplicationError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('ApplicationError');
  });

  it('creates ValidationError with 400 status code', () => {
    const error = new ValidationError('Invalid email format');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid email format');
  });

  it('creates UnauthorizedError with 401 status code', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('creates ForbiddenError with 403 status code', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('creates NotFoundError with 404 status code', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('creates ConsentRequiredError with 428 status code', () => {
    const error = new ConsentRequiredError();
    expect(error.statusCode).toBe(428);
    expect(error.code).toBe('CONSENT_REQUIRED');
  });

  it('creates RateLimitError with 429 status code and retryAfter detail', () => {
    const error = new RateLimitError('Too many requests', 60);
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.details).toEqual({ retryAfter: 60 });
  });

  it('creates QuotaExceededError with 429 status code', () => {
    const error = new QuotaExceededError('Daily limit reached', 3600);
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('QUOTA_EXCEEDED');
    expect(error.details).toEqual({ retryAfter: 3600 });
  });

  it('creates ExternalServiceError with custom status code', () => {
    const error = new ExternalServiceError('Gemini API unavailable', 503);
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  it('creates InternalServerError with 500 status code', () => {
    const error = new InternalServerError();
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
