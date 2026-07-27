import React, { useState, useCallback, createContext, useEffect } from 'react';
import { useGeneration } from '@/hooks/useGeneration';
import { GeminiHealthStatus } from '@/services/geminiService';
import { LANGUAGES, TRANSLATIONS, COLOR_PALETTES } from '@/shared/constants';
import { AppContextType } from '@/shared/types';
import {
  AiProcessingMode,
  clearPrivacyPreference,
  loadPrivacyPreference,
  savePrivacyPreference,
} from '@/shared/privacy';
import {
  AiProcessingMode,
  clearPrivacyPreference,
  loadPrivacyPreference,
  savePrivacyPreference,
} from '@/shared/privacy';
import {
  modificationSchema,
  newsletterFormSchema,
  sanitizeFormData,
  validateSchema,
} from '@/shared/validation';

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [privacyMode, setPrivacyModeState] = useState<AiProcessingMode | null>(() => loadPrivacyPreference()?.mode || null);
  const [userName, setUserName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [prompt, setPrompt] = useState('');
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [selectedPalette, setSelectedPalette] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [newsletter, setNewsletter] = useState('');
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [pageState, setPageState] = useState<'form' | 'loading' | 'result' | 'dashboard'>('form');
  const [language, setLanguage] = useState(LANGUAGES[0].value);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState('');
  const [location, setLocation] = useState('');
  const [themeColor, setThemeColor] = useState('#10b981');
  const [lastPrompt, setLastPrompt] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState<GeminiHealthStatus>({
    ok: false,
    checked: false,
    retrying: true,
    message: 'Checking Gemini API availability…',
  });

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let message = TRANSLATIONS[language]?.[key] || TRANSLATIONS['en-US'][key] || key;
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          message = message.replace(`{${paramKey}}`, String(paramValue));
        }
      }
      return message;
    },
    [language]
  );

  const { generateWebsiteContent, generateNewsletterContent } = useGeneration({ t });

  const setPrivacyMode = useCallback((mode: AiProcessingMode) => {
    savePrivacyPreference(mode);
    setPrivacyModeState(mode);
    setError(null);
  }, []);

  const handleGenerateWrapper = useCallback(
    async (options?: { modPrompt?: string }) => {
      const formData = sanitizeFormData({
        userName,
        businessName,
        userEmail,
        userPhone,
        prompt,
        services,
        location,
        themeColor,
        selectedPalette,
      });

      setLastPrompt(prompt);
      setPageState('loading');
      setError(null);
      setGeneratedUrl('');
      setNewsletter('');

      const result = await generateWebsiteContent(formData, options?.modPrompt, {
        onRetry: (attempt, err) => {
          setRetryCount(attempt);
          setError(err.message);
        },
      });

      if (result.success) {
        if (result.code.trim().toLowerCase().startsWith('<!doctype html')) {
          setGeneratedCode(result.code);
          setPageState('result');
          setGeneratedUrl(`data:text/html;charset=utf-8,${encodeURIComponent(result.code)}`);
          setRetryCount(0);
        } else {
          setError(t('updateFailed'));
          setGeneratedCode(generatedCode || '');
          setPageState('result');
        }
      } else {
        setError(`Failed to generate website: ${result.error}`);
        setGeneratedCode(generatedCode || '');
        setPageState('result');
        setRetryCount((prev) => prev + 1);
      }

      if (options?.modPrompt) {
        setModificationPrompt('');
      }
    },
    [
      prompt,
      userName,
      businessName,
      userEmail,
      userPhone,
      selectedPalette,
      services,
      location,
      themeColor,
      generatedCode,
      t,
      generateWebsiteContent,
    ]
  );

  const handleGenerate = useCallback(() => handleGenerateWrapper(), [handleGenerateWrapper]);

  const handleAssist = useCallback(async () => {
    const validation = validateSchema(
      modificationSchema,
      sanitizeFormData({ modificationPrompt }),
      t
    );

    if (validation.success === false) {
      setError(validation.firstError);
      return;
    }

    await handleGenerateWrapper({ modPrompt: validation.data.modificationPrompt });
  }, [modificationPrompt, handleGenerateWrapper, t]);

  const handleGenerateNewsletter = useCallback(async () => {
    const validation = validateSchema(
      newsletterFormSchema,
      sanitizeFormData({ prompt, businessName, generatedUrl }),
      t
    );

    if (validation.success === false) {
      setError(validation.firstError);
      return;
    }

    setIsGeneratingPost(true);
    setError(null);
    const result = await generateNewsletterContent({ prompt, businessName });
    if (result.success) {
      setNewsletter(result.newsletterText);
    } else {
      setError(`Failed to generate newsletter: ${result.error}`);
    }
    setIsGeneratingPost(false);
  }, [prompt, businessName, generatedUrl, t, generateNewsletterContent]);

  const handleSelectExample = useCallback((examplePrompt: string) => {
    setPrompt(examplePrompt);
    setPageState('form');
  }, []);

  const handleRetry = useCallback(async () => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please try again with different inputs.');
      return;
    }

    if (lastPrompt) {
      setPrompt(lastPrompt);
      setRetryCount((prev) => prev + 1);
      await handleGenerateWrapper();
    } else {
      setError('No previous prompt to retry.');
    }
  }, [lastPrompt, retryCount, handleGenerateWrapper]);

  const reset = useCallback(() => {
    setPrompt('');
    setUserName('');
    setBusinessName('');
    setUserEmail('');
    setUserPhone('');
    setSelectedPalette('');
    setGeneratedCode('');
    setGeneratedUrl('');
    setNewsletter('');
    setIsGeneratingPost(false);
    setModificationPrompt('');
    setError(null);
    setPageState('form');
    setLastPrompt('');
    setRetryCount(0);
    setServices('');
    setLocation('');
    setThemeColor('#10b981');
  }, []);

  const clearPrivateData = useCallback(() => {
    reset();
    clearPrivacyPreference();
    setPrivacyModeState(null);
  }, [reset]);

  const reviewPrivacyChoice = useCallback(() => {
    clearPrivacyPreference();
    setPrivacyModeState(null);
  }, []);

  const value = {
    privacyMode,
    setPrivacyMode,
    reviewPrivacyChoice,
    clearPrivateData,
    prompt,
    setPrompt,
    generatedCode,
    pageState,
    setPageState,
    language,
    setLanguage,
    error,
    setError,
    handleGenerate,
    reset,
    t,
    userName,
    setUserName,
    businessName,
    setBusinessName,
    userEmail,
    setUserEmail,
    userPhone,
    setUserPhone,
    selectedPalette,
    setSelectedPalette,
    modificationPrompt,
    setModificationPrompt,
    handleAssist,
    generatedUrl,
    newsletter,
    isGeneratingPost,
    handleGenerateNewsletter,
    handleSelectExample,
    services,
    setServices,
    location,
    setLocation,
    themeColor,
    setThemeColor,
    lastPrompt,
    setLastPrompt,
    retryCount,
    setRetryCount,
    handleRetry,
    healthStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};