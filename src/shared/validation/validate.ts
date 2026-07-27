import { z } from 'zod';
import { FIELD_LIMITS, VALIDATION_ERROR_KEYS } from './schemas';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/** Map a Zod issue to a user-facing translation key with optional params. */
export function getIssueTranslationKey(issue: z.ZodIssue): {
  key: string;
  params?: Record<string, string | number>;
} {
  const field = issue.path[0] as string;
  const limits = FIELD_LIMITS[field as keyof typeof FIELD_LIMITS];

  if (issue.code === 'too_small' && 'minimum' in issue && issue.minimum === 1) {
    return { key: VALIDATION_ERROR_KEYS.required };
  }
  if (issue.code === 'too_small' && 'minimum' in issue && limits && 'min' in limits) {
    return { key: VALIDATION_ERROR_KEYS.minLength, params: { min: limits.min } };
  }
  if (issue.code === 'too_big' && 'maximum' in issue && limits && 'max' in limits) {
    return { key: VALIDATION_ERROR_KEYS.maxLength, params: { max: limits.max } };
  }
  if (issue.code === 'too_small' && 'minimum' in issue && typeof issue.minimum === 'number') {
    return { key: VALIDATION_ERROR_KEYS.minValue, params: { min: issue.minimum } };
  }
  if (issue.code === 'too_big' && 'maximum' in issue && typeof issue.maximum === 'number') {
    return { key: VALIDATION_ERROR_KEYS.maxValue, params: { max: issue.maximum } };
  }

  if (typeof issue.message === 'string' && issue.message.startsWith('validation')) {
    return { key: issue.message };
  }

  return { key: issue.message || VALIDATION_ERROR_KEYS.required };
}

export function formatZodError(error: z.ZodError, t: TranslateFn): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_form';
    if (fieldErrors[field]) continue;
    const { key, params } = getIssueTranslationKey(issue);
    fieldErrors[field] = t(key, params);
  }
  return fieldErrors;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string>; firstError: string };

export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  t: TranslateFn
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = formatZodError(result.error, t);
  const firstError = Object.values(errors)[0] || t(VALIDATION_ERROR_KEYS.formIncomplete);
  return { success: false, errors, firstError };
}

export function validateField<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  field: keyof T & string,
  data: Record<string, unknown>,
  t: TranslateFn
): string | undefined {
  const fieldSchema = schema.shape[field] as unknown as z.ZodType | undefined;
  if (!fieldSchema) return undefined;

  const result = fieldSchema.safeParse(data[field]);
  if (result.success) return undefined;

  const issue = result.error.issues[0];
  if (!issue) return undefined;
  const { key, params } = getIssueTranslationKey(issue);
  return t(key, params);
}
