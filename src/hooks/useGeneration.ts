import { useCallback } from 'react';
import { generateWebsite, generateNewsletter } from '@/services/geminiService';
import { COLOR_PALETTES } from '@/shared/constants';
import { sanitizeFormData, validateSchema } from '@/shared/validation';
import { websiteFormSchema, newsletterFormSchema } from '@/shared/validation';
import { withRetry } from '@/utils/retry';
import { error as logError, info as logInfo } from '@/utils/logger';

interface UseGenerationProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

type WebsiteGenerationResult = { success: true; code: string } | { success: false; error: string };

type NewsletterGenerationResult =
  { success: true; newsletterText: string } | { success: false; error: string };

interface WebsiteGenerationOptions {
  onRetry?: (attempt: number, error: Error) => void;
}

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string>; firstError: string };

type ValidationFailure<T> = ValidationResult<T> & { success: false };

const isValidationFailure = <T>(result: ValidationResult<T>): result is ValidationFailure<T> =>
  result.success === false;

export function useGeneration({ t }: UseGenerationProps) {
  const generateWebsiteContent = useCallback(
    async (
      formState: Record<string, string>,
      modificationPrompt?: string,
      options: WebsiteGenerationOptions = {}
    ): Promise<WebsiteGenerationResult> => {
      const sanitized = sanitizeFormData(formState);
      const validation = validateSchema(websiteFormSchema, sanitized, t);
      if (!validation.success) {
        return { success: false, error: validation.firstError };
      }

      const validated = validation.data;
      const paletteDetails =
        COLOR_PALETTES.find((p) => p.name === validated.selectedPalette)?.description || '';

      try {
        const code = await withRetry(
          () =>
            generateWebsite({
              description: validated.prompt,
              userName: validated.userName,
              businessName: validated.businessName,
              userEmail: validated.userEmail,
              userPhone: validated.userPhone,
              paletteName: validated.selectedPalette,
              paletteDetails,
              modificationPrompt,
            }),
          {
            retries: 3,
            onRetry: (attempt, err) => {
              options.onRetry?.(attempt, err);
              logInfo('Retry attempt', attempt, err.message);
            },
          }
        );
        return { success: true, code };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        logError('Website generation failed', errorMessage);
        return { success: false, error: errorMessage };
      }
    }
    ,[t]
  );

  const generateNewsletterContent = useCallback(
    async (formState: Record<string, string>): Promise<NewsletterGenerationResult> => {
      const sanitized = sanitizeFormData(formState);
      const validation = validateSchema(newsletterFormSchema, sanitized, t);
      if (!validation.success) {
        return { success: false, error: validation.firstError };
      }

      try {
        const newsletterText = await generateNewsletter({
          description: sanitized.prompt,
          businessName: sanitized.businessName,
        });
        return { success: true, newsletterText };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        logError('Newsletter generation failed', errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [t]
  );

  return {
    generateWebsiteContent,
    generateNewsletterContent,
  };
}
