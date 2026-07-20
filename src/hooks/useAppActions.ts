import { useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from './useTranslation';
import { useGeneration } from './useGeneration';
import { checkGeminiHealth } from '../services/geminiService';
import { sanitizeFormData, validateSchema, modificationSchema, newsletterFormSchema } from '../shared/validation';
import { clearPrivacyPreference, savePrivacyPreference, AiProcessingMode } from '../shared/privacy';

export function useAppActions() {
  const store = useAppStore();
  const { t } = useTranslation();
  const { generateWebsiteContent, generateNewsletterContent } = useGeneration({ t });

  useEffect(() => {
    let active = true;
    const validateHealth = async () => {
      const result = await checkGeminiHealth({ retries: 3, delayMs: 1000 });
      if (active) {
        store.setHealthStatus(result);
      }
    };
    validateHealth();
    return () => {
      active = false;
    };
  }, [store]);

  const handleGenerateWrapper = useCallback(async (options?: { modPrompt?: string }) => {
    if (!store.healthStatus.ok) {
      store.setError(store.healthStatus.message);
      store.setPageState('form');
      return;
    }

    const formData = sanitizeFormData({
      userName: store.userName,
      businessName: store.businessName,
      userEmail: store.userEmail,
      userPhone: store.userPhone,
      prompt: store.prompt,
      services: store.services,
      location: store.location,
      themeColor: store.themeColor,
      selectedPalette: store.selectedPalette,
    });

    store.setLastPrompt(store.prompt);
    store.setPageState('loading');
    store.setError(null);
    store.setGeneratedUrl('');
    store.setNewsletter('');

    const result = await generateWebsiteContent(formData, options?.modPrompt, {
      onRetry: (attempt, err) => {
        store.setRetryCount(attempt);
        store.setError(err.message);
      },
    });

    if (result.success) {
      if (result.code.trim().toLowerCase().startsWith('<!doctype html')) {
        store.setGeneratedCode(result.code);
        store.setPageState('result');
        store.setGeneratedUrl(`data:text/html;charset=utf-8,${encodeURIComponent(result.code)}`);
        store.setRetryCount(0);
      } else {
        store.setError(t('updateFailed'));
        store.setGeneratedCode(store.generatedCode || '');
        store.setPageState('result');
      }
    } else {
      store.setError(`Failed to generate website: ${(result as {success: false, error: string}).error}`);
      store.setGeneratedCode(store.generatedCode || '');
      store.setPageState('result');
      store.setRetryCount((prev) => prev + 1);
    }

    if (options?.modPrompt) {
      store.setModificationPrompt('');
    }
  }, [store, t, generateWebsiteContent]);

  const handleGenerate = useCallback(() => handleGenerateWrapper(), [handleGenerateWrapper]);

  const handleAssist = useCallback(async () => {
    const validation = validateSchema(
      modificationSchema,
      sanitizeFormData({ modificationPrompt: store.modificationPrompt }),
      t
    );

    if (validation.success === false) {
      store.setError(validation.firstError);
      return;
    }

    await handleGenerateWrapper({ modPrompt: validation.data.modificationPrompt });
  }, [store.modificationPrompt, handleGenerateWrapper, t, store]);

  const handleGenerateNewsletter = useCallback(async () => {
    if (!store.healthStatus.ok) {
      store.setError(store.healthStatus.message);
      return;
    }

    const validation = validateSchema(
      newsletterFormSchema,
      sanitizeFormData({ prompt: store.prompt, businessName: store.businessName, generatedUrl: store.generatedUrl }),
      t
    );

    if (validation.success === false) {
      store.setError(validation.firstError);
      return;
    }

    store.setIsGeneratingPost(true);
    store.setError(null);

    try {
      const result = await generateNewsletterContent({ prompt: store.prompt, businessName: store.businessName });
      if (result.success) {
        store.setNewsletter(result.newsletterText);
      } else {
        store.setError(`Failed to generate newsletter: ${(result as {success: false, error: string}).error}`);
      }
    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      store.setIsGeneratingPost(false);
    }
  }, [store, t, generateNewsletterContent]);

  const handleSelectExample = useCallback((examplePrompt: string) => {
    store.setPrompt(examplePrompt);
    store.setPageState('form');
  }, [store]);

  const handleRetry = useCallback(async () => {
    if (store.retryCount >= 3) {
      store.setError('Maximum retry attempts reached. Please try again with different inputs.');
      return;
    }

    if (store.lastPrompt) {
      store.setPrompt(store.lastPrompt);
      store.setRetryCount((prev) => prev + 1);
      await handleGenerateWrapper();
    } else {
      store.setError('No previous prompt to retry.');
    }
  }, [store, handleGenerateWrapper]);

  const reset = useCallback(() => {
    store.resetApp();
  }, [store]);

  const setPrivacyMode = useCallback((mode: AiProcessingMode) => {
    savePrivacyPreference(mode);
    store.setPrivacyModeState(mode);
  }, [store]);

  const clearPrivateData = useCallback(() => {
    reset();
    clearPrivacyPreference();
    store.setPrivacyModeState(null);
  }, [reset, store]);

  const reviewPrivacyChoice = useCallback(() => {
    clearPrivacyPreference();
    store.setPrivacyModeState(null);
  }, [store]);

  return {
    handleGenerateWrapper,
    handleGenerate,
    handleAssist,
    handleGenerateNewsletter,
    handleSelectExample,
    handleRetry,
    reset,
    setPrivacyMode,
    clearPrivateData,
    reviewPrivacyChoice,
  };
}
