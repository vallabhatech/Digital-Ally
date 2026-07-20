import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { validateField, validateSchema } from '@/shared/validation';

import type { TranslationKey } from '@/hooks/useTranslation';

type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;
interface UseFormValidationOptions<T extends z.ZodRawShape> {
  schema: z.ZodObject<T>;
  values: Record<keyof T & string, unknown>;
  t: TranslateFn;
}

export function useFormValidation<T extends z.ZodRawShape>({
  schema,
  values,
  t,
}: UseFormValidationOptions<T>) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    const result: Record<string, string> = {};
    for (const field of Object.keys(schema.shape)) {
      if (touched[field] || submitted) {
        const error = validateField(schema, field, values, t);
        if (error) result[field] = error;
      }
    }
    return result;
  }, [schema, values, touched, submitted, t]);

  const validFields = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const field of Object.keys(schema.shape)) {
      if (touched[field] && !errors[field]) {
        const error = validateField(schema, field, values, t);
        result[field] = !error;
      }
    }
    return result;
  }, [schema, values, touched, errors, t]);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const markAllTouched = useCallback(() => {
    const allTouched: Record<string, boolean> = {};
    for (const field of Object.keys(schema.shape)) {
      allTouched[field] = true;
    }
    setTouched(allTouched);
    setSubmitted(true);
  }, [schema]);

  const validateAll = useCallback(() => {
    markAllTouched();
    return validateSchema(schema, values, t);
  }, [schema, values, t, markAllTouched]);

  const resetValidation = useCallback(() => {
    setTouched({});
    setSubmitted(false);
  }, []);

  const isFieldValid = useCallback(
    (field: string) => Boolean(validFields[field]),
    [validFields],
  );

  const hasErrors = Object.keys(errors).length > 0;

  const isFormValid = useMemo(() => {
    const result = validateSchema(schema, values, t);
    return result.success;
  }, [schema, values, t]);

  return {
    errors,
    touched,
    validFields,
    hasErrors,
    isFormValid,
    markTouched,
    markAllTouched,
    validateAll,
    resetValidation,
    isFieldValid,
  };
}
