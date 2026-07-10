import React, { useState, useCallback, useMemo } from 'react';
import { sanitizePreviewHtml } from '@/utils/sanitize';
import { useAppStore } from '@/store/useAppStore';
import {
  selectError,
  selectGeneratedCode,
  selectGeneratedUrl,
  selectHandleAssist,
  selectHandleGenerateNewsletter,
  selectHandleRetry,
  selectIsGeneratingPost,
  selectLanguage,
  selectModificationPrompt,
  selectNewsletter,
  selectReset,
  selectRetryCount,
  selectSetField,
  selectTranslator,
} from '@/store/selectors';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useFormValidation } from '@/hooks/useFormValidation';
import { modificationSchema } from '@/shared/validation';
import { CheckIcon, CopyIcon, DownloadIcon } from '@/components/IconSet';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SectionCard } from '@/components/ui/SectionCard';
import { PreviewTabs } from '@/components/ui/PreviewTabs';
import { ExportActions } from '@/components/ui/ExportActions';
import { ModificationForm } from '@/components/ui/ModificationForm';

export const OutputPanel: React.FC = () => {
  const generatedCode = useAppStore(selectGeneratedCode);
  const error = useAppStore(selectError);
  const t = useAppStore(selectTranslator);
  const reset = useAppStore(selectReset);
  const handleModify = useAppStore(selectHandleAssist);
  const generatedUrl = useAppStore(selectGeneratedUrl);
  const newsletter = useAppStore(selectNewsletter);
  const isGeneratingPost = useAppStore(selectIsGeneratingPost);
  const handleGenerateNewsletter = useAppStore(selectHandleGenerateNewsletter);
  const language = useAppStore(selectLanguage);
  const retryCount = useAppStore(selectRetryCount);
  const handleRetry = useAppStore(selectHandleRetry);
  const modificationPrompt = useAppStore(selectModificationPrompt);
  const setField = useAppStore(selectSetField);

  // Sync utilities with store hooks proxies
  const setModificationPrompt = useCallback(
    (val: string) => setField('modificationPrompt', val),
    [setField]
  );
  const setError = useCallback((val: string | null) => setField('error', val), [setField]);

  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'preview' | 'code'>('preview');

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
    validateAll: validateModification,
    isFormValid: isModificationValid,
  } = useFormValidation({
    schema: modificationSchema,
    values: { modificationPrompt },
    t,
  }) as any;

  const parseRateLimitError = (errorMsg: string) => {
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
    handleModify();
  }, [validateModification, handleModify, setError]);

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
            {isRateLimit ? `Try again in ${retryMinutes} min` : t('tryAgain')}
          </button>

          {!isRateLimit && (
            <>
              <button
                onClick={handleRegenerate}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-500 transition"
              >
                Retry with Modifications
              </button>
              {retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  className="bg-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-500 transition"
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
      <div className="flex-1 flex flex-col bg-gray-900 text-white">
        <div className="flex-shrink-0 bg-gray-800 p-2 flex flex-col gap-4 border-b border-gray-700 lg:flex-row lg:items-center lg:justify-between">
          <PreviewTabs activeView={view} onChange={setView} />
          {error && (
            <p className="text-red-400 text-sm animate-pulse">
              {t('updateFailed')}: {error}
            </p>
          )}
          <div className="flex items-center gap-2 justify-center lg:justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition text-sm"
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
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition text-sm"
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
          <button
            onClick={handleGenerateNewsletter}
            disabled={isGeneratingPost}
            className="w-full flex items-center justify-center gap-2 bg-lime-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-lime-700 transition disabled:bg-gray-400"
          >
            {isGeneratingPost && <LoadingSpinner className="w-5 h-5" />}
            {isGeneratingPost ? t('generatingNewsletter') : t('generateNewsletter')}
          </button>
          {newsletter && (
            <textarea
              readOnly
              value={newsletter}
              className="w-full mt-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md h-32 resize-y text-sm"
            />
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
