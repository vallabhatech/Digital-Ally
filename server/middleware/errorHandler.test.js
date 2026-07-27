import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from './errorHandler.js';
import { ValidationError, QuotaExceededError } from '../errors/appErrors.js';

describe('Express Error Handling Middleware', () => {
  it('formats ApplicationError into standardized JSON response', () => {
    const err = new ValidationError('Invalid email format', { field: 'email' });
    const req = { method: 'POST', path: '/api/v1/ai/generate' };
    const res = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      set(key, val) {
        this.headers[key] = val;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      data: null,
      meta: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        details: { field: 'email' },
      },
    });
  });

  it('sets Retry-After header for QuotaExceededError', () => {
    const err = new QuotaExceededError('Limit reached', 3600);
    const req = { method: 'POST', path: '/api/v1/ai/generate' };
    const res = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      set(key, val) {
        this.headers[key] = val;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBe('3600');
    expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('handles unexpected native Error gracefully as 500', () => {
    const err = new Error('Database connection failed');
    const req = { method: 'GET', path: '/api/logs' };
    const res = {
      statusCode: 200,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      set(key, val) {
        this.headers[key] = val;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.error.message).toBe('Database connection failed');
  });
});
