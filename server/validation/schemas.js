import { z } from 'zod';

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

export const logQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  task: z.string().optional(),
  statusCode: z.coerce.number().optional(),
  since: z.string().optional(),
  until: z.string().optional(),
});

export const auditQuerySchema = logQuerySchema;

export const abuseReportSchema = z.object({
  url: z.string().url('Must be a valid URL').optional(),
  reason: z.enum(['inappropriate', 'spam', 'copyright', 'other']),
  description: z.string().min(10).max(1000),
});
