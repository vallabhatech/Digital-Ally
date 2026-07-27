/** Strip non-printable control characters from user input. */
export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/** Trim and strip control characters from a string field. */
export function sanitizeString(value: string): string {
  return stripControlChars(value).trim();
}

/** Sanitize all string values in a form data object. */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (typeof val === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeString(val);
    }
  }
  return result;
}
