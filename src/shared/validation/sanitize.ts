/** Strip non-printable control characters from user input. */
export function stripControlChars(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    const isForbidden =
      (code >= 0x00 && code <= 0x08) ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f) ||
      code === 0x7f;
    if (!isForbidden) out += ch;
  }
  return out;
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
