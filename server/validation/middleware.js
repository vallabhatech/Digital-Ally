import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeDeep(obj) {
  if (typeof obj === 'string') return purify.sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeDeep);
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeDeep(value);
    }
    return sanitized;
  }
  return obj;
}

export function sanitizeRequest(req, res, next) {
  if (req.body) req.body = sanitizeDeep(req.body);
  if (req.query) req.query = sanitizeDeep(req.query);
  if (req.params) req.params = sanitizeDeep(req.params);
  next();
}

function createValidationMiddleware(schema, source) {
  return (req, res, next) => {
    const dataToValidate = source === 'headers' ? req.headers : (req[source] ?? {});
    const result = schema.safeParse(dataToValidate);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '_form',
        message: issue.message,
        code: issue.code,
      }));
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: details[0]?.message || 'Validation failed',
          details,
        },
      });
    }
    
    if (source === 'body') req.validatedBody = result.data;
    if (source === 'query') req.validatedQuery = result.data;
    if (source === 'headers') req.validatedHeaders = result.data;
    
    next();
  };
}

export function validateBody(schema) {
  return createValidationMiddleware(schema, 'body');
}

export function validateQuery(schema) {
  return createValidationMiddleware(schema, 'query');
}

export function validateHeaders(schema) {
  return createValidationMiddleware(schema, 'headers');
}

