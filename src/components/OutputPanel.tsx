import React, { useState, useCallback, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { 
    CheckIcon, CopyIcon, DownloadIcon, ArrowPathIcon, EyeIcon, CodeIcon, 
    MicrophoneIcon 
} from './icons';
import { LoadingSpinner } from './LoadingSpinner';

export const OutputPanel: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    
    const [copied, setCopied] = useState(false);
    const [view, setView] = useState<'preview' | 'code'>('preview');
    const [modificationPrompt, setModificationPrompt] = useState('');
    
    const { 
        generatedCode, error, t, reset, handleAssist, generatedUrl, newsletter, 
        isGeneratingPost, handleGenerateNewsletter, language, setError, retryCount, handleRetry
    } = context;

    const { isListening, error: speechError, toggleListening } = useSpeechToText({ 
        onTranscript: setModificationPrompt, 
        lang: language 
    });

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

    const handleRegenerate = useCallback(() => {
        if (!modificationPrompt.trim()) {
            setError('Please provide modification instructions.');
            return;
        }
        handleAssist();
    }, [modificationPrompt, handleAssist, setError]);

    if (error && !generatedCode) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-4">
                <h3 className="text-xl font-semibold text-red-600 mt-4">{t('generationFailed')}</h3>
                <p className="mt-2 max-w-prose">{error}</p>
                {retryCount > 0 && (
                    <p className="text-sm text-gray-600 mt-2">Retry attempt {retryCount} of 3</p>
                )}
                <div className="mt-8 flex gap-4 flex-wrap justify-center">
                    <button 
                        onClick={reset} 
                        className="bg-lime-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-lime-500 transition-all duration-200"
                    >
                        {t('tryAgain')}
                    </button>
                    <button 
                        onClick={handleRegenerate}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-500 transition-all duration-200"
                    >
                        Retry with Modifications
                    </button>
                    {retryCount < 3 && (
                        <button 
                            onClick={handleRetry}
                            className="bg-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-500 transition-all duration-200"
                        >
                            Retry Last Request ({3 - retryCount} left)
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col lg:flex-row">
            {/* Left Side - Preview */}
            <div className="flex-1 flex flex-col bg-gray-900 text-white">
                <div className="flex-shrink-0 bg-gray-800 p-2 flex justify-between items-center gap-2 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setView('preview')} 
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                view === 'preview' ? 'bg-lime-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <EyeIcon className="w-5 h-5" /> {t('preview')}
                        </button>
                        <button 
                            onClick={() => setView('code')} 
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                view === 'code' ? 'bg-lime-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <CodeIcon className="w-5 h-5" /> {t('code')}
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm animate-pulse mx-auto">{t('updateFailed')}: {error}</p>}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleCopy} 
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm" 
                            aria-label="Copy Code"
                        >
                            {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                            {copied ? t('copied') : t('copyCode')}
                        </button>
                        <button 
                            onClick={handleDownload} 
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm" 
                            aria-label="Download HTML"
                        >
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
            </div>

            {/* Right Side - Controls */}
            <div className="w-full lg:w-1/3 xl:w-1/4 max-w-sm flex-shrink-0 bg-white p-6 overflow-y-auto border-r border-gray-200 h-full">
                <h2 className="text-xl font-bold text-gray-800 mb-1">Modify & Export</h2>
                <p className="text-sm text-gray-500 mb-6">Make changes or download your website</p>

                {/* Modification Section */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-800 mb-2">AI Assistant</h3>
                    <p className="text-xs text-gray-500 mb-2">Describe changes you want to make</p>
                    <div className="relative">
                        <textarea 
                            value={modificationPrompt} 
                            onChange={e => setModificationPrompt(e.target.value)} 
                            placeholder="e.g., Make the headline bolder, change colors, add a contact form" 
                            className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-500 h-24 resize-y pr-10"
                        />
                        <button 
                            onClick={toggleListening} 
                            className={`absolute top-2 right-2 p-1.5 rounded-full ${
                                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`} 
                            aria-label={isListening ? 'Stop Listening' : 'Start Listening'}
                        >
                            <MicrophoneIcon className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleRegenerate} 
                        disabled={!modificationPrompt.trim()} 
                        className="mt-4 w-full bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-gray-400"
                    >
                        Apply Changes
                    </button>
                    {speechError && <p className="text-red-500 mt-2 text-xs">{speechError}</p>}
                </div>

                {/* Export Actions */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-800 mb-2">Export Options</h3>
                    <div className="space-y-2">
                        <a
                            href={generatedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                            <EyeIcon className="w-4 h-4"/> Open in New Tab
                        </a>
                        <button 
                            onClick={handleDownload} 
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                            <DownloadIcon className="w-4 h-4"/> Download HTML
                        </button>
                        <button 
                            onClick={handleCopy} 
                            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                            {copied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4"/>}
                            {copied ? t('copied') : t('copyCode')}
                        </button>
                    </div>
                </div>

                {/* Newsletter Generation */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-800 mb-2">Marketing</h3>
                    <button 
                        onClick={handleGenerateNewsletter} 
                        disabled={isGeneratingPost} 
                        className="w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition disabled:bg-gray-400"
                    >
                        {isGeneratingPost ? <LoadingSpinner className="w-5 h-5" /> : null}
                        {isGeneratingPost ? t('generatingNewsletter') : t('generateNewsletter')}
                    </button>
                    {newsletter && (
                        <div className="mt-4 space-y-2">
                            <textarea 
                                readOnly value={newsletter} 
                                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md h-32 resize-y text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Reset */}
                <button 
                    onClick={reset} 
                    className="w-full text-center text-sm text-gray-500 hover:text-lime-600 font-medium"
                >
                    {t('startOver')}
                </button>
            </div>
        </div>
    );
};