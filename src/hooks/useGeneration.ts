import { useCallback } from 'react';
import { generateWebsite, generateNewsletter } from '@/features/generation/geminiService';
import { websiteFormSchema, sanitizeFormData, validateSchema } from '@/shared/validation';

interface UseGenerationProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

interface GenerationOptions {
  onRetry?: (attempt: number, error: Error) => void;
}

export function useGeneration({ t }: UseGenerationProps) {
  const generateWebsiteContent = useCallback(
    async (formState: Record<string, any>, modificationPrompt?: string, options?: GenerationOptions) => {
      try {
        const sanitized = sanitizeFormData(formState);
        const validation = validateSchema(websiteFormSchema, sanitized, t) as any;

        if (validation.success === false) {
          return { error: validation.firstError };
        }

        const result = await generateWebsite({
          formData: validation.data,
          modificationPrompt,
          onRetry: options?.onRetry,
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        return { error: errorMessage };
      }
    },
    [t]
  );

  const generateNewsletterContent = useCallback(
    async (formState: { prompt: string; businessName: string }) => {
      try {
        const result = await generateNewsletter({
          prompt: formState.prompt,
          businessName: formState.businessName,
        });
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        return { error: errorMessage };
      }
    },
    []
  );

  return {
    generateWebsiteContent,
    generateNewsletterContent,
  };
}