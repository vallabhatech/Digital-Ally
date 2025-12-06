

import React, { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateWebsite, generateNewsletter, analyzeAndTranslateDashboard } from './services/geminiService';
import { LANGUAGES, TRANSLATIONS, COLOR_PALETTES } from './constants';
import { useSpeechToText } from './hooks/useSpeechToText';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { AppContextType } from './types';
import { 
  MicrophoneIcon, CopyIcon, DownloadIcon, CheckIcon, ArrowPathIcon, EyeIcon, 
  CodeIcon, WhatsAppIcon, UserGroupIcon, CalendarDaysIcon, ChatBubbleOvalLeftEllipsisIcon, 
  DocumentChartBarIcon, BuildingStorefrontIcon, ArrowRightIcon, PlusCircleIcon, SparklesIcon,
  StopCircleIcon, SpeakerWaveIcon
} from './components/icons';

// 1. App Context for State Management
export const AppContext = createContext<AppContextType | null>(null);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en-US'][key];
  }, [language]);

  const handleGenerateWrapper = useCallback(async (options?: { modPrompt?: string }) => {
    if (!prompt.trim() || !userName.trim() || !businessName.trim() || !selectedPalette) {
      setError(t('errorFormNotComplete'));
      return;
    }
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
  };
  
  const handleSelectExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setPageState('form');
  };

  const value = {
    prompt, setPrompt, generatedCode, pageState, setPageState, language, setLanguage, error, setError,
    handleGenerate, reset, t, userName, setUserName, businessName, setBusinessName,
    userEmail, setUserEmail, userPhone, setUserPhone, selectedPalette, setSelectedPalette,
    modificationPrompt, setModificationPrompt, handleAssist, generatedUrl, newsletter, 
    isGeneratingPost, handleGenerateNewsletter, handleSelectExample
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 2. Page Components
const FormView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    
    const { 
        t, userName, setUserName, businessName, setBusinessName, userEmail, setUserEmail, 
        userPhone, setUserPhone, prompt, setPrompt, selectedPalette, setSelectedPalette,
        handleGenerate, language, error
    } = context;

    const { isListening, error: speechError, toggleListening } = useSpeechToText({ onTranscript: setPrompt, lang: language });
    const [unlockedSections, setUnlockedSections] = useState({ description: false, style: false });

    const detailsComplete = userName.trim() !== '' && businessName.trim() !== '' && userEmail.trim() !== '' && userPhone.trim() !== '';
    const descriptionComplete = prompt.trim() !== '';
    
    useEffect(() => {
        setUnlockedSections({
            description: detailsComplete,
            style: detailsComplete && descriptionComplete,
        });
    }, [detailsComplete, descriptionComplete]);

    const canGenerate = detailsComplete && descriptionComplete && selectedPalette;

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in-up">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800">{t('headline1')}</h2>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{t('subheadline')}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
                {/* Step 1: Details */}
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                        {t('formStep1Title')}
                        {detailsComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                    </h3>
                    <p className="text-gray-500 mb-6">{t('step1Subtitle')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t('yourNamePlaceholder')} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" />
                        <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t('businessNamePlaceholder')} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" />
                        <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" />
                        <input type="tel" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder={t('phonePlaceholder')} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lime-500" />
                    </div>
                </div>

                {/* Step 2: Description */}
                {unlockedSections.description && (
                  <div className="mb-8 animate-fade-in-up-short">
                      <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-3">
                          {t('step2Title')}
                          {descriptionComplete && <CheckIcon className="w-6 h-6 text-green-500"/>}
                      </h3>
                      <p className="text-gray-500 mb-6">{t('step2Subtitle')}</p>
                       <div className="relative">
                          <textarea
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              className="w-full h-36 p-4 pr-16 bg-white/50 border border-gray-200 rounded-lg text-lg focus:ring-2 focus:ring-lime-500 resize-y"
                              placeholder={t('placeholder')}
                          />
                          <button
                              onClick={toggleListening}
                              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                                  isListening
                                      ? 'bg-red-500 text-white animate-pulse'
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                              aria-label={isListening ? t('stopListening') : t('startListening')}
                          >
                              <MicrophoneIcon className="w-6 h-6" />
                          </button>
                      </div>
                      {speechError && <p className="text-red-500 mt-2">{speechError}</p>}
                  </div>
                )}

                {/* Step 3: Style */}
                {unlockedSections.style && (
                  <div className="animate-fade-in-up-short">
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{t('step3Title')}</h3>
                      <p className="text-gray-500 mb-6">{t('step3Subtitle')}</p>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {COLOR_PALETTES.map(p => (
                              <button key={p.name} onClick={() => setSelectedPalette(p.name)} className={`p-4 rounded-lg border-4 transition ${selectedPalette === p.name ? 'border-lime-500 scale-105' : 'border-gray-200 hover:border-lime-300'}`}>
                                  <div className="flex -space-x-2 justify-center mb-2">
                                     {Object.values(p.palette).map((color, i) => <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${color}`}></div>)}
                                  </div>
                                  <h3 className="font-bold text-gray-800">{t(p.name)}</h3>
                              </button>
                          ))}
                      </div>
                      
                      {error && <p className="text-red-500 mt-6 text-center font-medium">{error}</p>}

                      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                          <button onClick={handleGenerate} disabled={!canGenerate} className="bg-lime-500 text-white font-bold py-4 px-16 text-lg rounded-lg hover:bg-lime-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto">
                              <SparklesIcon className="w-6 h-6" /> {t('generateButton')}
                          </button>
                      </div>
                  </div>
                )}
            </div>
        </div>
    );
};

const LoadingState: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-4">
            <LoadingSpinner className="w-12 h-12 text-lime-500" />
            <h3 className="text-2xl font-semibold text-gray-800 mt-6">{context.t('loadingMessage')}</h3>
            <p className="mt-2 text-gray-500">{context.t('loadingSubMessage')}</p>
        </div>
    );
};

const DashboardCard: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 flex flex-col hover:shadow-lime-100 hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center gap-3 mb-3">
      <div className="bg-lime-100 text-lime-700 rounded-full p-2">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <div className="text-gray-600 space-y-2 flex-grow flex flex-col">{children}</div>
  </div>
);

const DashboardPage: React.FC = () => {
  const context = useContext(AppContext);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { isSpeaking, speak, cancel } = useTextToSpeech();
  
  if (!context) return null;
  const { t, businessName, userName, userEmail, userPhone, setPageState, language, error, setError, generatedCode } = context;

  const handleAnalyze = async () => {
    if (isSpeaking) {
        cancel();
        return;
    }
    if (!businessName || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    const dashboardData = `
      - Business Name: ${businessName}
      - Today's Visitors: 1,234
      - Peak Time: 2:15 PM
      - Most Viewed Page: ${t('servicesPage')}
      - Upcoming Campaign: ${t('summerSale')}
      - Latest Review Sentiment: ${t('positive')}
    `;
    
    try {
      const result = await analyzeAndTranslateDashboard({
        dashboardData,
        language,
      });
      setAnalysisResult(result);
      speak(result, language);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze dashboard: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!businessName && !generatedCode) {
    return (
      <div className="text-center p-8 animate-fade-in-up">
        <div className="bg-white rounded-lg shadow-lg p-12 border border-gray-200 max-w-lg mx-auto">
            <SparklesIcon className="w-16 h-16 text-lime-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">{t('dashboardWelcome')}</h2>
            <p className="mt-4 text-gray-600">{t('dashboardPrompt')}</p>
            <button onClick={() => setPageState('form')} className="mt-8 bg-lime-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-lime-700 transition flex items-center gap-2 mx-auto">
                {t('goToGenerator')} <ArrowRightIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generatedCode && (
           <DashboardCard title={t('yourWebsite')} icon={<EyeIcon className="w-7 h-7" />}>
            <div className="relative w-full h-40 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 group">
                <iframe
                    srcDoc={generatedCode}
                    title={t('preview')}
                    className="w-[200%] h-[200%] scale-50 origin-top-left transform pointer-events-none"
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
            <button
                onClick={() => setPageState('result')}
                className="mt-auto pt-3 w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition"
            >
                <CodeIcon className="w-5 h-5"/>
                {t('customizeWebsite')}
            </button>
          </DashboardCard>
        )}
        <DashboardCard title={t('businessProfile')} icon={<BuildingStorefrontIcon className="w-7 h-7" />}>
          <p><strong>{t('businessNamePlaceholder')}:</strong> {businessName}</p>
          <p><strong>{t('yourNamePlaceholder')}:</strong> {userName}</p>
          <p><strong>{t('emailPlaceholder')}:</strong> {userEmail}</p>
          <p><strong>{t('phonePlaceholder')}:</strong> {userPhone}</p>
        </DashboardCard>
        <DashboardCard title={t('aiAnalysis')} icon={<SparklesIcon className="w-7 h-7" />}>
          <p className="text-sm mb-4 flex-grow">{t('aiAnalysisSubtext')}</p>
          <button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !businessName}
              className="w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition disabled:bg-gray-400"
          >
              {isAnalyzing 
                  ? <LoadingSpinner className="w-5 h-5" />
                  : (isSpeaking ? <StopCircleIcon className="w-5 h-5"/> : <SpeakerWaveIcon className="w-5 h-5"/>)
              }
              {isAnalyzing ? t('analyzing') : (isSpeaking ? t('stopSpeaking') : t('analyzeAndSpeak'))}
          </button>
          {error && !isAnalyzing && <p className="text-red-500 mt-2 text-xs text-center">{error}</p>}
           {analysisResult && !isAnalyzing && (
              <div className="mt-4 p-3 bg-lime-50 border border-lime-200 rounded-lg text-sm text-lime-900">
                  {analysisResult}
              </div>
          )}
        </DashboardCard>
        <DashboardCard title={t('todaysVisitors')} icon={<UserGroupIcon className="w-7 h-7" />}>
           <p className="text-4xl font-bold text-gray-900">1,234</p>
           <p><strong>{t('peakTime')}:</strong> 2:15 PM</p>
           <p><strong>{t('mostViewed')}:</strong> {t('servicesPage')}</p>
        </DashboardCard>
        <DashboardCard title={t('campaignLaunches')} icon={<CalendarDaysIcon className="w-7 h-7" />}>
            <p><strong>{t('upcoming')}:</strong> {t('summerSale')}</p>
            <p><strong>{t('past')}:</strong> {t('springLaunch')}</p>
            <button className="text-lime-600 font-semibold flex items-center gap-1 mt-2 hover:underline"><PlusCircleIcon className="w-5 h-5"/> {t('newCampaign')}</button>
        </DashboardCard>
        <DashboardCard title={t('mostViewedPages')} icon={<DocumentChartBarIcon className="w-7 h-7" />}>
            <ol className="list-decimal list-inside space-y-1">
                <li>{t('homePage')}</li>
                <li>{t('servicesPage')}</li>
                <li>{t('aboutPage')}</li>
            </ol>
        </DashboardCard>
        <DashboardCard title={t('latestReviews')} icon={<ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />}>
             <p>"Great service! Very happy." - ⭐⭐⭐⭐⭐</p>
             <p>"The product was okay." - ⭐⭐⭐☆☆</p>
             <p><strong>{t('sentiment')}:</strong> <span className="text-green-600 font-semibold">{t('positive')}</span></p>
        </DashboardCard>
      </div>
    </div>
  );
};

const PostGenerationActions: React.FC = () => {
    const context = useContext(AppContext);
    const [urlCopied, setUrlCopied] = useState(false);
    const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
    if (!context) return null;

    const { t, generatedUrl, newsletter, isGeneratingPost, handleGenerateNewsletter } = context;

    const handleCopyUrl = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl).then(() => {
            setUrlCopied(true);
            setTimeout(() => setUrlCopied(false), 2000);
        });
    };

    const handleShare = () => {
        if (!newsletter) return;
        navigator.clipboard.writeText(newsletter).then(() => {
            setShareStatus('copied');
            window.open(`https://wa.me/`, '_blank', 'noopener,noreferrer');
            setTimeout(() => setShareStatus('idle'), 3000);
        }).catch(err => {
            console.error('Failed to copy newsletter:', err);
        });
    }

    if (!generatedUrl) return null;

    return (
        <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-gray-800">{t('promoteYourSite')}</h3>
            <div className="mt-4 space-y-4">
                 <div className="grid grid-cols-2 gap-2">
                    <a
                        href={generatedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                        <EyeIcon className="w-4 h-4"/> {t('openWebsite')}
                    </a>
                    <button 
                        onClick={handleCopyUrl} 
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                        {urlCopied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4"/>}
                        {urlCopied ? t('copied') : t('copyLink')}
                    </button>
                </div>
                <div>
                    <button onClick={handleGenerateNewsletter} disabled={isGeneratingPost} className="w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition disabled:bg-gray-400">
                       {isGeneratingPost ? <LoadingSpinner className="w-5 h-5" /> : null}
                       {isGeneratingPost ? t('generatingNewsletter') : t('generateNewsletter')}
                    </button>
                </div>
                {newsletter && (
                    <div className="space-y-2">
                        <textarea readOnly value={newsletter} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md h-32 resize-y text-sm"/>
                        <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition">
                           <WhatsAppIcon className="w-5 h-5"/>
                           {shareStatus === 'copied' ? t('copied') : t('shareOnWhatsApp')}
                        </button>
                        {shareStatus === 'copied' && <p className="text-sm text-center text-green-700 font-medium pt-1">{t('pasteInWhatsApp')}</p>}
                    </div>
                )}
            </div>
        </div>
    )
}

const CustomizationSidebar: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const {
        t, userName, setUserName, businessName, setBusinessName, userEmail, setUserEmail,
        userPhone, setUserPhone, prompt, setPrompt, selectedPalette, setSelectedPalette,
        modificationPrompt, setModificationPrompt, handleGenerate, handleAssist, reset, language, 
        setError
    } = context;
    
    const { isListening, error: speechError, toggleListening } = useSpeechToText({ onTranscript: setModificationPrompt, lang: language });
    useEffect(() => { if (speechError) setError(speechError) }, [speechError, setError]);

    const canGenerate = prompt.trim() && userName.trim() && businessName.trim() && selectedPalette;

    return (
        <aside className="w-full md:w-1/3 lg:w-1/4 max-w-sm flex-shrink-0 bg-white p-6 overflow-y-auto border-r border-gray-200 h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{t('customizeAndRegenerate')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('yourChanges')}</p>

            <div className="space-y-4 text-sm">
                <div>
                    <label className="font-semibold text-gray-600">{t('yourNamePlaceholder')}</label>
                    <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-500"/>
                </div>
                 <div>
                    <label className="font-semibold text-gray-600">{t('businessNamePlaceholder')}</label>
                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-500"/>
                </div>
                <div>
                    <label className="font-semibold text-gray-600">{t('emailPlaceholder')}</label>
                    <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-500"/>
                </div>
                <div>
                    <label className="font-semibold text-gray-600">{t('phonePlaceholder')}</label>
                    <input type="tel" value={userPhone} onChange={e => setUserPhone(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-500"/>
                </div>
                <div>
                    <label className="font-semibold text-gray-600">{t('step2Title')}</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-500 h-24 resize-y"/>
                </div>
                <div>
                    <label className="font-semibold text-gray-600 mb-2 block">{t('step3Title')}</label>
                    <div className="grid grid-cols-2 gap-2">
                        {COLOR_PALETTES.map(p => (
                            <button key={p.name} onClick={() => setSelectedPalette(p.name)} className={`p-2 rounded-md border-2 ${selectedPalette === p.name ? 'border-lime-500' : 'border-gray-200'}`}>
                                <div className="flex -space-x-1 justify-center mb-1">
                                    {Object.values(p.palette).map((color, i) => <div key={i} className={`w-4 h-4 rounded-full border border-white ${color}`}></div>)}
                                </div>
                                <h3 className="font-medium text-xs text-gray-700">{t(p.name)}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <button onClick={handleGenerate} disabled={!canGenerate} className="mt-6 w-full bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2">
                <ArrowPathIcon className="w-5 h-5" /> {t('regenerateButton')}
            </button>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-800">{t('aiAssistant')}</h3>
                <p className="text-xs text-gray-500 mb-2">{t('aiAssistantHint')}</p>
                <div className="relative">
                    <textarea value={modificationPrompt} onChange={e => setModificationPrompt(e.target.value)} placeholder={t('placeholderAssistant')} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-500 h-20 resize-y pr-10"/>
                    <button onClick={toggleListening} className={`absolute top-2 right-2 p-1.5 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} aria-label={isListening ? 'Stop Listening' : 'Start Listening'}>
                        <MicrophoneIcon className="w-4 h-4" />
                    </button>
                </div>
                
                 <button onClick={handleAssist} disabled={!modificationPrompt.trim()} className="mt-4 w-full bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-gray-400">
                    {t('updateWithAssistant')}
                </button>
            </div>
            
            <PostGenerationActions />
            
             <button onClick={reset} className="mt-6 w-full text-center text-sm text-gray-500 hover:text-lime-600 font-medium">
                {t('startOver')}
            </button>
        </aside>
    );
};

const ResultPage: React.FC = () => {
    const context = useContext(AppContext);
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'preview' | 'code'>('preview');

    if (!context) return null;
    const { generatedCode, error, t, reset } = context;

    const handleCopy = useCallback(() => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [generatedCode]);

    const handleDownload = useCallback(() => {
        if (!generatedCode) return;
        const blob = new Blob([generatedCode], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [generatedCode]);

    if (error && !generatedCode) {
         return (
             <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-4">
                <h3 className="text-xl font-semibold text-red-600 mt-4">{t('generationFailed')}</h3>
                <p className="mt-2 max-w-prose">{error}</p>
                 <button onClick={reset} className="mt-8 bg-lime-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-lime-500 transition-all duration-200">
                    {t('tryAgain')}
                </button>
             </div>
         );
    }
    
    return (
        <div className="w-full h-full flex flex-row">
            <CustomizationSidebar />
            <main className="flex-1 flex flex-col bg-gray-900 text-white">
                 <div className="flex-shrink-0 bg-gray-800 p-2 flex justify-between items-center gap-2 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('preview')} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${view === 'preview' ? 'bg-lime-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                            <EyeIcon className="w-5 h-5" /> {t('preview')}
                        </button>
                        <button onClick={() => setView('code')} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${view === 'code' ? 'bg-lime-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                            <CodeIcon className="w-5 h-5" /> {t('code')}
                        </button>
                    </div>
                     {error && <p className="text-red-400 text-sm animate-pulse mx-auto">{t('updateFailed')}: {error}</p>}
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm" aria-label="Copy Code">
                            {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                            {copied ? t('copied') : t('copyCode')}
                        </button>
                        <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm" aria-label="Download HTML">
                            <DownloadIcon className="w-5 h-5" /> {t('download')}
                        </button>
                    </div>
                </div>
                {view === 'preview' ? (
                    <iframe
                        srcDoc={generatedCode}
                        title="Website Preview"
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-same-origin"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-900 p-4 overflow-auto">
                        <pre className="text-sm text-gray-200 whitespace-pre-wrap">
                            <code>{generatedCode}</code>
                        </pre>
                    </div>
                )}
            </main>
        </div>
    );
};

const AppContent: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { pageState } = context;

    const renderPage = () => {
        switch (pageState) {
            case 'form':
                return <FormView />;
            case 'loading':
                return <LoadingState />;
            case 'result':
                return <ResultPage />;
            case 'dashboard':
                return <DashboardPage />;
            default:
                return <FormView />;
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans text-gray-800 bg-transparent">
            <Header />
            <main className="flex-grow flex items-center justify-center overflow-auto w-full">
                {renderPage()}
            </main>
        </div>
    )
}

// 3. Main App Component
const App: React.FC = () => {
  return (
    <AppProvider>
        <AppContent />
    </AppProvider>
  );
};

export default App;