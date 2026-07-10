import { describe, it, expect } from 'vitest';
import {
  websiteFormSchema,
  modificationSchema,
  passwordSchema,
  passwordConfirmationSchema,
  urlSchema,
  serverPromptSchema,
  sanitizeString,
  sanitizeFormData,
} from './index';

const validForm = {
  userName: 'Jane Doe',
  businessName: 'Acme Coffee',
  userEmail: 'jane@acme.com',
  userPhone: '+1 (555) 123-4567',
  prompt: 'We sell organic coffee and pastries in Brooklyn.',
  services: 'Coffee, pastries, and catering services.',
  location: 'Brooklyn, NY',
  themeColor: '#10b981',
  selectedPalette: 'Modern',
};

describe('websiteFormSchema', () => {
  it('accepts valid form data', () => {
    expect(websiteFormSchema.safeParse(validForm).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = websiteFormSchema.safeParse({ ...validForm, userEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone', () => {
    const result = websiteFormSchema.safeParse({ ...validForm, userPhone: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects short prompt', () => {
    const result = websiteFormSchema.safeParse({ ...validForm, prompt: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex color', () => {
    const result = websiteFormSchema.safeParse({ ...validForm, themeColor: 'red' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid palette', () => {
    const result = websiteFormSchema.safeParse({ ...validForm, selectedPalette: 'Neon' });
    expect(result.success).toBe(false);
  });

  it('allows empty optional location', () => {
    const result = websiteFormSchema.safeParse({ ...validForm, location: '' });
    expect(result.success).toBe(true);
  });
});

describe('modificationSchema', () => {
  it('accepts valid modification prompt', () => {
    expect(
      modificationSchema.safeParse({ modificationPrompt: 'Make the headline bolder please.' })
        .success
    ).toBe(true);
  });

  it('rejects too-short modification', () => {
    expect(modificationSchema.safeParse({ modificationPrompt: 'hi' }).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts strong password', () => {
    expect(passwordSchema.safeParse('SecurePass1').success).toBe(true);
  });

  it('rejects weak password', () => {
    expect(passwordSchema.safeParse('weak').success).toBe(false);
  });
});

describe('urlSchema', () => {
  it('accepts valid URL', () => {
    expect(urlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('rejects invalid URL', () => {
    expect(urlSchema.safeParse('not-a-url').success).toBe(false);
  });
});

describe('serverPromptSchema', () => {
  it('accepts valid prompt', () => {
    expect(serverPromptSchema.safeParse({ prompt: 'Build a website' }).success).toBe(true);
  });

  it('rejects empty prompt', () => {
    expect(serverPromptSchema.safeParse({ prompt: '' }).success).toBe(false);
  });

  it('rejects prompt over 5000 chars', () => {
    expect(serverPromptSchema.safeParse({ prompt: 'a'.repeat(5001) }).success).toBe(false);
  });
});

describe('sanitize', () => {
  it('strips control characters and trims', () => {
    expect(sanitizeString('  hello\x00world  ')).toBe('helloworld');
  });

  it('sanitizes all string fields in form data', () => {
    const result = sanitizeFormData({ name: '  test\x01 ', count: 5 });
    expect(result.name).toBe('test');
    expect(result.count).toBe(5);
  });
});

describe('cross-field password confirmation', () => {
  it('accepts matching passwords', () => {
    expect(
      passwordConfirmationSchema.safeParse({
        password: 'SecurePass1',
        confirmPassword: 'SecurePass1',
      }).success
    ).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = passwordConfirmationSchema.safeParse({
      password: 'SecurePass1',
      confirmPassword: 'DifferentPass1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });
});
