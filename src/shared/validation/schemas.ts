import { z } from 'zod';
import { COLOR_PALETTES } from '@/shared/constants';

const PALETTE_NAMES = COLOR_PALETTES.map((p) => p.name) as [string, ...string[]];

const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export const VALIDATION_ERROR_KEYS = {
  required: 'validationRequired',
  email: 'validationEmail',
  phone: 'validationPhone',
  url: 'validationUrl',
  password: 'validationPassword',
  minLength: 'validationMinLength',
  maxLength: 'validationMaxLength',
  minValue: 'validationMinValue',
  maxValue: 'validationMaxValue',
  hexColor: 'validationHexColor',
  palette: 'validationPalette',
  formIncomplete: 'errorFormNotComplete',
  assistantRequired: 'errorAssistant',
} as const;

export const FIELD_LIMITS = {
  userName: { min: 2, max: 100 },
  businessName: { min: 2, max: 100 },
  userEmail: { max: 254 },
  userPhone: { min: 7, max: 20 },
  prompt: { min: 10, max: 2000 },
  services: { min: 5, max: 1000 },
  location: { max: 200 },
  modificationPrompt: { min: 5, max: 2000 },
  password: { min: 8, max: 128 },
} as const;

export const passwordSchema = z
  .string()
  .min(FIELD_LIMITS.password.min, VALIDATION_ERROR_KEYS.minLength)
  .max(FIELD_LIMITS.password.max, VALIDATION_ERROR_KEYS.maxLength)
  .regex(/[A-Z]/, VALIDATION_ERROR_KEYS.password)
  .regex(/[a-z]/, VALIDATION_ERROR_KEYS.password)
  .regex(/[0-9]/, VALIDATION_ERROR_KEYS.password);

export const passwordConfirmationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, VALIDATION_ERROR_KEYS.required),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validationPasswordMismatch',
    path: ['confirmPassword'],
  });

export const urlSchema = z
  .string()
  .min(1, VALIDATION_ERROR_KEYS.required)
  .regex(URL_REGEX, VALIDATION_ERROR_KEYS.url);

export const websiteFormSchema = z.object({
  userName: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.required)
    .min(FIELD_LIMITS.userName.min, VALIDATION_ERROR_KEYS.minLength)
    .max(FIELD_LIMITS.userName.max, VALIDATION_ERROR_KEYS.maxLength),
  businessName: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.required)
    .min(FIELD_LIMITS.businessName.min, VALIDATION_ERROR_KEYS.minLength)
    .max(FIELD_LIMITS.businessName.max, VALIDATION_ERROR_KEYS.maxLength),
  userEmail: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.required)
    .email(VALIDATION_ERROR_KEYS.email)
    .max(FIELD_LIMITS.userEmail.max, VALIDATION_ERROR_KEYS.maxLength),
  userPhone: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.required)
    .regex(PHONE_REGEX, VALIDATION_ERROR_KEYS.phone)
    .min(FIELD_LIMITS.userPhone.min, VALIDATION_ERROR_KEYS.minLength)
    .max(FIELD_LIMITS.userPhone.max, VALIDATION_ERROR_KEYS.maxLength),
  prompt: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.required)
    .min(FIELD_LIMITS.prompt.min, VALIDATION_ERROR_KEYS.minLength)
    .max(FIELD_LIMITS.prompt.max, VALIDATION_ERROR_KEYS.maxLength),
  services: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.required)
    .min(FIELD_LIMITS.services.min, VALIDATION_ERROR_KEYS.minLength)
    .max(FIELD_LIMITS.services.max, VALIDATION_ERROR_KEYS.maxLength),
  location: z
    .string()
    .max(FIELD_LIMITS.location.max, VALIDATION_ERROR_KEYS.maxLength)
    .optional()
    .or(z.literal('')),
  themeColor: z.string().regex(HEX_COLOR_REGEX, VALIDATION_ERROR_KEYS.hexColor),
  selectedPalette: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.required)
    .refine((val) => PALETTE_NAMES.includes(val), VALIDATION_ERROR_KEYS.palette),
});

export const modificationSchema = z.object({
  modificationPrompt: z
    .string()
    .min(1, VALIDATION_ERROR_KEYS.assistantRequired)
    .min(FIELD_LIMITS.modificationPrompt.min, VALIDATION_ERROR_KEYS.minLength)
    .max(FIELD_LIMITS.modificationPrompt.max, VALIDATION_ERROR_KEYS.maxLength),
});

export const newsletterFormSchema = z.object({
  prompt: z.string().min(1, VALIDATION_ERROR_KEYS.required),
  businessName: z.string().min(1, VALIDATION_ERROR_KEYS.required),
  generatedUrl: z.string().min(1, VALIDATION_ERROR_KEYS.required),
});

export const serverPromptSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(5000, 'Prompt exceeds maximum length of 5000 characters'),
  outputFormat: z.enum(['html', 'react', 'zip']).optional().default('html'),
});

export const serverNewsletterSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(8000, 'Prompt exceeds maximum length of 8000 characters'),
});

export const serverAnalysisSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(15000, 'Prompt exceeds maximum length of 15000 characters'),
});

export type WebsiteFormData = z.infer<typeof websiteFormSchema>;
export type ModificationFormData = z.infer<typeof modificationSchema>;
