import React, { useState, useCallback, useContext, useMemo } from 'react';
import { sanitizePreviewHtml } from '@/utils/sanitize';
import { AppContext } from '@/app/context/AppContext';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useFormValidation } from '@/hooks/useFormValidation';
import { modificationSchema } from '@/shared/validation';
import { ValidatedField } from '@/components/ValidatedField';
import { CheckIcon, CopyIcon, DownloadIcon, EyeIcon, CodeIcon } from '@/components/IconSet';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SectionCard } from '@/components/ui/SectionCard';
import { PreviewTabs } from '@/components/ui/PreviewTabs';
import { ExportActions } from '@/components/ui/ExportActions';
import { ModificationForm } from '@/components/ui/ModificationForm';

export const OutputPanel: React.FC = () => {
  const context = useContext(AppContext);

  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const {
    generatedCode,
    error,
    t,
    reset,
    handleAssist,
    generatedUrl,
    newsletter,
    isGeneratingPost,
    handleGenerateNewsletter,
    language,
    setError,
    retryCount,
    handleRetry,
    modificationPrompt,
    setModificationPrompt,
    healthStatus,
  } = context!;

  const { html: safeHtml, hadUnsafeContent } = useMemo(
    () => sanitizePreviewHtml(generatedCode || ''),
    [generatedCode]
  );

  const {
    isListening,
    error: speechError,
    toggleListening,
  } = useSpeechToText({
    onTranscript: setModificationPrompt,
    lang: language,
  });

  const {
    errors: modErrors,
    markTouched: markModTouched,
    validateAll: validateModification,
    isFieldValid: isModFieldValid,
    isFormValid: isModificationValid,
  } = useFormValidation({
    schema: modificationSchema,
    values: { modificationPrompt },
    t,
  });

  // Parse rate limit error and convert to user-friendly message
  const parseRateLimitError = (
    errorMsg: string
  ): { isRateLimit: boolean; message: string; retryMinutes: number } => {
    if (errorMsg.startsWith('RATE_LIMIT_429|')) {
      const retrySeconds = parseInt(errorMsg.split('|')[1] || '900', 10);
      const retryMinutes = Math.ceil(retrySeconds / 60);
      return {
        isRateLimit: true,
        message: `You've reached your generation limit. Please try again in ${retryMinutes} ${retryMinutes === 1 ? 'minute' : 'minutes'}.`,
        retryMinutes,
      };
    }
    return { isRateLimit: false, message: errorMsg, retryMinutes: 0 };
  };

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
    const result = validateModification();
    if (result.success === false) {
      setError(result.firstError);
      return;
    }
    handleAssist();
  }, [validateModification, handleAssist, setError]);

  if (error && !generatedCode) {
    const { isRateLimit, message, retryMinutes } = parseRateLimitError(error);

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className={`${isRateLimit ? 'text-yellow-600' : 'text-red-500'}`}>
          <h3
            className={`text-xl font-semibold ${isRateLimit ? 'text-yellow-600' : 'text-red-600'} mt-4`}
          >
            {isRateLimit ? '⏳ Rate Limit Reached' : t('generationFailed')}
          </h3>
          <p className={`mt-2 max-w-prose ${isRateLimit ? 'text-yellow-700' : 'text-red-600'}`}>
            {message}
          </p>
        </div>

        {retryCount > 0 && !isRateLimit && (
          <p className="text-sm text-gray-600 mt-2">Retry attempt {retryCount} of 3</p>
        )}

        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          <button
            onClick={reset}
            className={`${isRateLimit ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-lime-600 hover:bg-lime-500'} text-white font-bold py-3 px-8 rounded-lg transition-all duration-200`}
            disabled={isRateLimit}
          >
            {isRateLimit
              ? `Try again in ${retryMinutes} ${retryMinutes === 1 ? 'minute' : 'minutes'}`
              : t('tryAgain')}
          </button>

          {!isRateLimit && (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      {/* Left Side - Preview */}
      <div className="flex-1 flex flex-col bg-gray-900 text-white">
        <div className="flex-shrink-0 bg-gray-800 p-2 flex flex-col gap-4 border-b border-gray-700 lg:flex-row lg:items-center lg:justify-between">
          <PreviewTabs activeView={view} onChange={setView} />
          {error && (
            <p className="text-red-400 text-sm animate-pulse mx-auto lg:mx-0">
              {t('updateFailed')}: {error}
            </p>
          )}
          <div className="flex items-center gap-2 justify-center lg:justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm"
              aria-label="Copy Code"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5 text-green-400" />
              ) : (
                <CopyIcon className="w-5 h-5" />
              )}
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
          <>
            {hadUnsafeContent && (
              <div className="flex-shrink-0 bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-xs px-4 py-1.5">
                ⚠️ Unsafe content was detected and removed from this preview.
              </div>
            )}
            <iframe
              srcDoc={safeHtml}
              title="Website Preview"
              className="w-full h-full border-none bg-white"
              sandbox="allow-same-origin"
            />
          </>
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
        <SectionCard
          title="Modify & Export"
          subtitle="Make changes or download your website"
          className="mb-6"
        >
          <ModificationForm
            value={modificationPrompt}
            onChange={setModificationPrompt}
            onSubmit={handleRegenerate}
            onToggleListening={toggleListening}
            isListening={isListening}
            isValid={isModificationValid}
            error={modErrors.modificationPrompt}
            t={t}
          />
          {speechError && <p className="text-red-500 mt-2 text-xs">{speechError}</p>}

          <div className="mt-6">
            <ExportActions
              generatedUrl={generatedUrl}
              onCopy={handleCopy}
              onDownload={handleDownload}
              copied={copied}
              copyLabel={copied ? t('copied') : t('copyCode')}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Marketing"
          subtitle="Generate a newsletter based on your website"
          className="mb-6"
        >
          {healthStatus.checked && !healthStatus.ok && (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {healthStatus.message}
            </p>
          )}
          <button
            onClick={handleGenerateNewsletter}
            disabled={isGeneratingPost || !healthStatus.ok}
            className="w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition disabled:bg-gray-400"
          >
            {isGeneratingPost ? <LoadingSpinner className="w-5 h-5" /> : null}
            {isGeneratingPost ? t('generatingNewsletter') : t('generateNewsletter')}
          </button>
          {newsletter && (
            <div className="mt-4 space-y-2">
              <textarea
                readOnly
                value={newsletter}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md h-32 resize-y text-sm"
              />
            </div>
          )}
        </SectionCard>

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
