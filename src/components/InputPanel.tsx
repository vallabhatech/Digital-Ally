import React, { useState, useContext, useCallback, useEffect } from 'react';
import { AppContext } from '@/app/context/AppContext';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useFormValidation } from '@/hooks/useFormValidation';
import { websiteFormSchema } from '@/shared/validation';
import { ValidatedField } from '@/components/ValidatedField';
import { CheckIcon, MicrophoneIcon, SparklesIcon } from '@/components/IconSet';
import { SectionCard } from '@/components/ui/SectionCard';
import { PaletteSelector } from '@/components/PaletteSelector';

export const InputPanel: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('InputPanel must be used within an AppProvider');
  }

  const {
    t,
    userName,
    setUserName,
    businessName,
    setBusinessName,
    userEmail,
    setUserEmail,
    userPhone,
    setUserPhone,
    prompt,
    setPrompt,
    selectedPalette,
    setSelectedPalette,
    handleGenerate,
    language,
    error,
    services,
    setServices,
    location,
    setLocation,
    themeColor,
    setThemeColor,
    healthStatus,
    setPrivacyMode,
  } = context;

  const formValues = {
    userName,
    businessName,
    userEmail,
    userPhone,
    prompt,
    services,
    location,
    themeColor,
    selectedPalette,
  };

  const { errors, markTouched, validateAll, isFieldValid, isFormValid } = useFormValidation({
    schema: websiteFormSchema,
    values: formValues,
    t,
  });

  const {
    isListening,
    error: speechError,
    toggleListening,
  } = useSpeechToText({ onTranscript: setPrompt, lang: language });
  const [unlockedSections, setUnlockedSections] = useState({
    details: false,
    description: false,
    services: false,
    style: false,
  });

  const detailsComplete =
    !errors.userName &&
    !errors.businessName &&
    !errors.userEmail &&
    !errors.userPhone &&
    userName.trim() !== '' &&
    businessName.trim() !== '' &&
    userEmail.trim() !== '' &&
    userPhone.trim() !== '';
  const descriptionComplete = !errors.prompt && prompt.trim() !== '';
  const servicesComplete = !errors.services && services.trim() !== '';

  useEffect(() => {
    setUnlockedSections({
      details: detailsComplete,
      description: detailsComplete,
      services: detailsComplete && descriptionComplete,
      style: detailsComplete && descriptionComplete && servicesComplete,
    });
  }, [detailsComplete, descriptionComplete, servicesComplete]);

  const canGenerate = isFormValid && healthStatus.ok;

  const onSubmit = useCallback(() => {
    const result = validateAll();
    if (result.success === false) return;
    handleGenerate();
  }, [validateAll, handleGenerate]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800">{t('headline1')}</h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{t('subheadline')}</p>
      </div>

      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
        <SectionCard
          title={t('formStep1Title')}
          subtitle={t('step1Subtitle')}
          completed={detailsComplete}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatedField
              label={t('yourNamePlaceholder')}
              error={errors.userName}
              isValid={isFieldValid('userName')}
              showSuccess
            >
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    markTouched('userName');
                  }}
                  onBlur={() => markTouched('userName')}
                  placeholder={t('yourNamePlaceholder')}
                />
              )}
            </ValidatedField>
            <ValidatedField
              label={t('businessNamePlaceholder')}
              error={errors.businessName}
              isValid={isFieldValid('businessName')}
              showSuccess
            >
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    markTouched('businessName');
                  }}
                  onBlur={() => markTouched('businessName')}
                  placeholder={t('businessNamePlaceholder')}
                />
              )}
            </ValidatedField>
            <ValidatedField
              label={t('emailPlaceholder')}
              error={errors.userEmail}
              isValid={isFieldValid('userEmail')}
              showSuccess
            >
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="email"
                  value={userEmail}
                  onChange={(e) => {
                    setUserEmail(e.target.value);
                    markTouched('userEmail');
                  }}
                  onBlur={() => markTouched('userEmail')}
                  placeholder={t('emailPlaceholder')}
                  autoComplete="email"
                />
              )}
            </ValidatedField>
            <ValidatedField
              label={t('phonePlaceholder')}
              error={errors.userPhone}
              isValid={isFieldValid('userPhone')}
              showSuccess
            >
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="tel"
                  value={userPhone}
                  onChange={(e) => {
                    setUserPhone(e.target.value);
                    markTouched('userPhone');
                  }}
                  onBlur={() => markTouched('userPhone')}
                  placeholder={t('phonePlaceholder')}
                  autoComplete="tel"
                />
              )}
            </ValidatedField>
          </div>
        </SectionCard>

        {unlockedSections.description && (
          <SectionCard
            title={t('step2Title')}
            subtitle={t('step2Subtitle')}
            completed={descriptionComplete}
          >
            <ValidatedField error={errors.prompt} isValid={isFieldValid('prompt')} showSuccess>
              {(fieldProps) => (
                <div className="relative">
                  <textarea
                    {...fieldProps}
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      markTouched('prompt');
                    }}
                    onBlur={() => markTouched('prompt')}
                    className={`${fieldProps.className} h-36 p-4 pr-16 text-lg resize-y`}
                    placeholder={t('placeholder')}
                  />
                  <button
                    type="button"
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
              )}
            </ValidatedField>
            {speechError && <p className="text-red-500 mt-2">{speechError}</p>}
          </SectionCard>
        )}

        {/* Step 3: Services */}
        {unlockedSections.services && (
          <SectionCard
            title="Services & Products"
            subtitle="Describe what your business offers"
            completed={servicesComplete}
          >
            <ValidatedField error={errors.services} isValid={isFieldValid('services')} showSuccess>
              {(fieldProps) => (
                <textarea
                  {...fieldProps}
                  value={services}
                  onChange={(e) => {
                    setServices(e.target.value);
                    markTouched('services');
                  }}
                  onBlur={() => markTouched('services')}
                  className={`${fieldProps.className} h-32 p-4 text-lg resize-y`}
                  placeholder="e.g., Web design, digital marketing, consulting, coffee and pastries..."
                />
              )}
            </ValidatedField>
          </SectionCard>
        )}

        {unlockedSections.style && (
          <SectionCard
            title="Location & Style"
            subtitle="Set your location and choose a style"
            completed={Boolean(location.trim() && themeColor && selectedPalette)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <ValidatedField
                label="Business Location"
                error={errors.location}
                isValid={isFieldValid('location')}
                showSuccess={Boolean(location.trim())}
              >
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    type="text"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      markTouched('location');
                    }}
                    onBlur={() => markTouched('location')}
                    placeholder="City, State or Country"
                  />
                )}
              </ValidatedField>

              <ValidatedField
                label="Theme Color"
                error={errors.themeColor}
                isValid={isFieldValid('themeColor')}
                showSuccess
              >
                {(fieldProps) => (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => {
                        setThemeColor(e.target.value);
                        markTouched('themeColor');
                      }}
                      onBlur={() => markTouched('themeColor')}
                      className="w-16 h-12 border border-gray-200 rounded cursor-pointer"
                      aria-label="Theme color picker"
                    />
                    <input
                      {...fieldProps}
                      type="text"
                      value={themeColor}
                      onChange={(e) => {
                        setThemeColor(e.target.value);
                        markTouched('themeColor');
                      }}
                      onBlur={() => markTouched('themeColor')}
                      placeholder="#10b981"
                      className={`${fieldProps.className} flex-1`}
                    />
                  </div>
                )}
              </ValidatedField>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Color Palette</label>
              <PaletteSelector
                selectedPalette={selectedPalette}
                onSelectPalette={(palette) => {
                  setSelectedPalette(palette);
                  markTouched('selectedPalette');
                }}
                error={errors.selectedPalette}
                getLabel={t}
              />
            </div>

            {error && (
              <p className="text-red-500 mt-6 text-center font-medium" role="alert">
                {error}
              </p>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              {!healthStatus.checked && (
                <p className="text-sm text-gray-500 mb-3">Checking Gemini API availability…</p>
              )}
              {healthStatus.checked && !healthStatus.ok && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center shadow-sm">
                  <p className="text-sm text-amber-800 font-medium mb-3" role="alert">
                    {healthStatus.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPrivacyMode('local')}
                    className="text-sm bg-lime-600 hover:bg-lime-700 text-white font-bold py-2.5 px-6 rounded-lg transition shadow flex items-center gap-2 mx-auto"
                  >
                    ⚡ Switch to Local-Only Mode (Instant Generation)
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canGenerate}
                className="bg-lime-500 text-white font-bold py-4 px-16 text-lg rounded-lg hover:bg-lime-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
              >
                <SparklesIcon className="w-6 h-6" /> {t('generateButton')}
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};
