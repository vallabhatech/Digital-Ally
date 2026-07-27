import { describe, expect, it } from 'vitest';
import {
  AppError,
  ApiError,
  AuthAppError,
  QuotaAppError,
  ValidationAppError,
  NetworkAppError,
} from './appErrors';

describe('Frontend Custom Error Hierarchy', () => {
  it('instantiates AppError with default code', () => {
    const err = new AppError('General application error');
    expect(err.message).toBe('General application error');
    expect(err.code).toBe('APP_ERROR');
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });

  it('instantiates ApiError with status code and details', () => {
    const err = new ApiError('Forbidden request', 403, 'FORBIDDEN', { resource: 'admin' });
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.details).toEqual({ resource: 'admin' });
    expect(err instanceof AppError).toBe(true);
  });

  it('instantiates AuthAppError with 401 status code', () => {
    const err = new AuthAppError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err instanceof ApiError).toBe(true);
  });

  it('instantiates QuotaAppError with retryAfter value', () => {
    const err = new QuotaAppError('Rate limit exceeded', 120);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('QUOTA_EXCEEDED');
    expect(err.retryAfter).toBe(120);
  });

  it('instantiates ValidationAppError', () => {
    const err = new ValidationAppError('Form invalid');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err instanceof AppError).toBe(true);
  });

  it('instantiates NetworkAppError', () => {
    const err = new NetworkAppError('Failed to fetch');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err instanceof AppError).toBe(true);
  });
});
