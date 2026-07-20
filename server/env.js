import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5174),
  GEMINI_API_KEY: z.string().optional(),
  SERVER_CLIENT_TOKEN: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  ADMIN_TOKEN: z.string().optional(),
  
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_WEBSITE: z.string().optional(),
  GEMINI_MODEL_NEWSLETTER: z.string().optional(),
  GEMINI_MODEL_ANALYSIS: z.string().optional(),
  GEMINI_TEMPERATURE: z.coerce.number().default(0.7),
  GEMINI_TOP_P: z.coerce.number().default(0.95),
  
  DAILY_QUOTA: z.coerce.number().default(100),
  MONTHLY_QUOTA: z.coerce.number().default(1000),
  AI_CONSENT_VERSION: z.string().default('2026-06-21'),
  
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(10),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
