import React, { useState, useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { COLOR_PALETTES } from '../constants';
import { 
    CheckIcon, CopyIcon, DownloadIcon, ArrowPathIcon, EyeIcon, CodeIcon, WhatsAppIcon, 
    MicrophoneIcon, LoadingSpinner 
} from '../components/icons';

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

export const ResultPage: React.FC = () => {
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
