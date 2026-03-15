import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { generateWebsite, generateNewsletter, analyzeAndTranslateDashboard } from '../services/geminiService';
import { LANGUAGES, TRANSLATIONS, COLOR_PALETTES } from '../constants';
import { AppContextType } from '../types';

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  
  // New fields for enhanced InputPanel
  const [services, setServices] = useState('');
  const [location, setLocation] = useState('');
  const [themeColor, setThemeColor] = useState('#10b981');
  
  // Retry system fields
  const [lastPrompt, setLastPrompt] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en-US'][key];
  }, [language]);

  const handleGenerateWrapper = useCallback(async (options?: { modPrompt?: string }) => {
    if (!prompt.trim() || !userName.trim() || !businessName.trim() || !selectedPalette) {
      setError(t('errorFormNotComplete'));
      return;
    }
    
    // Store the current prompt for retry functionality
    setLastPrompt(prompt);
    setPageState('loading');
    setError(null);
    setGeneratedUrl('');
    setNewsletter('');

    const modPrompt = options?.modPrompt;
    
    try {
      const paletteDetails = COLOR_PALETTES.find(p => p.name === selectedPalette)?.description || '';
      const code = await generateWebsite({
        description: prompt,
        userName,
        businessName,
        userEmail,
        userPhone,
        paletteName: selectedPalette,
        paletteDetails,
        modificationPrompt: modPrompt,
      });
      if (code.trim().toLowerCase().startsWith('<!doctype html')) {
        setGeneratedCode(code);
        setPageState('result');
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;
        setGeneratedUrl(dataUrl);
        // Reset retry count on successful generation
        setRetryCount(0);

      } else {
        setError(t('updateFailed'));
        console.warn("Received non-HTML response:", code);
        setGeneratedCode(generatedCode || '');
        setPageState('result');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate website: ${errorMessage}`);
      setGeneratedCode(generatedCode || '');
      setPageState('result');
      // Increment retry count on failure
      setRetryCount(prev => prev + 1);
    } finally {
        if (modPrompt) setModificationPrompt('');
    }
  }, [prompt, userName, businessName, userEmail, userPhone, selectedPalette, generatedCode, t]);
  
  const handleGenerate = () => handleGenerateWrapper();
  
  const handleAssist = useCallback(async () => {
      if (!modificationPrompt.trim()) {
          setError(t('errorAssistant'));
          return;
      }
      handleGenerateWrapper({ modPrompt: modificationPrompt });
  }, [modificationPrompt, handleGenerateWrapper, t]);

  const handleGenerateNewsletter = useCallback(async () => {
    if (!prompt || !businessName || !generatedUrl) return;
    setIsGeneratingPost(true);
    setError(null);
    try {
        const newsletterText = await generateNewsletter({
            description: prompt,
            businessName,
        });
        setNewsletter(newsletterText);
    } catch(err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate newsletter: ${errorMessage}`);
    } finally {
        setIsGeneratingPost(false);
    }
  }, [prompt, businessName, generatedUrl]);

  const handleSelectExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setPageState('form');
  };

  const handleRetry = useCallback(async () => {
    // Check if we've exceeded max retry attempts (3 attempts)
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please try again with different inputs.');
      return;
    }

    // Use the last prompt for retry
    if (lastPrompt) {
      setPrompt(lastPrompt);
      await handleGenerateWrapper();
    } else {
      setError('No previous prompt to retry.');
    }
  }, [lastPrompt, retryCount, handleGenerateWrapper]);

  const reset = () => {
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
    // Reset retry fields
    setLastPrompt('');
    setRetryCount(0);
  };

  const value = {
    prompt, setPrompt, generatedCode, pageState, setPageState, language, setLanguage, error, setError,
    handleGenerate, reset, t, userName, setUserName, businessName, setBusinessName,
    userEmail, setUserEmail, userPhone, setUserPhone, selectedPalette, setSelectedPalette,
    modificationPrompt, setModificationPrompt, handleAssist, generatedUrl, newsletter, 
    isGeneratingPost, handleGenerateNewsletter, handleSelectExample,
    // New fields
    services, setServices, location, setLocation, themeColor, setThemeColor,
    lastPrompt, setLastPrompt, retryCount, setRetryCount, handleRetry
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
