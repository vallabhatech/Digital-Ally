import { z } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns standardized error envelope on failure.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
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
    req.validatedBody = result.data;
    next();
  };
}
