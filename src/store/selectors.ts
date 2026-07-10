import type { AppStore } from '@/shared/types';

export const selectPrivacyMode = (state: AppStore) => state.privacyMode;

export const selectLanguage = (state: AppStore) => state.ui.language;
export const selectPageState = (state: AppStore) => state.ui.pageState;
export const selectError = (state: AppStore) => state.ui.error;
export const selectRetryCount = (state: AppStore) => state.ui.retryCount;
export const selectHealthStatus = (state: AppStore) => state.ui.healthStatus;

export const selectUserName = (state: AppStore) => state.user.name;
export const selectUserEmail = (state: AppStore) => state.user.email;
export const selectUserPhone = (state: AppStore) => state.user.phone;

export const selectBusinessName = (state: AppStore) => state.business.name;
export const selectServices = (state: AppStore) => state.business.services;
export const selectLocation = (state: AppStore) => state.business.location;

export const selectPrompt = (state: AppStore) => state.draft.prompt;
export const selectModificationPrompt = (state: AppStore) => state.draft.modificationPrompt;
export const selectSelectedPalette = (state: AppStore) => state.draft.selectedPalette;
export const selectThemeColor = (state: AppStore) => state.draft.themeColor;

export const selectGeneratedCode = (state: AppStore) => state.generation.generatedCode;
export const selectGeneratedUrl = (state: AppStore) => state.generation.generatedUrl;
export const selectNewsletter = (state: AppStore) => state.generation.newsletter;
export const selectIsGeneratingPost = (state: AppStore) => state.generation.isGeneratingPost;

export const selectTranslator = (state: AppStore) => state.t;

export const selectSetField = (state: AppStore) => state.setField;
export const selectSetPrivacyMode = (state: AppStore) => state.setPrivacyMode;
export const selectReviewPrivacyChoice = (state: AppStore) => state.reviewPrivacyChoice;
export const selectClearPrivateData = (state: AppStore) => state.clearPrivateData;
export const selectHandleSelectExample = (state: AppStore) => state.handleSelectExample;
export const selectCheckHealth = (state: AppStore) => state.checkHealth;

export const selectHandleGenerate = (state: AppStore) => state.handleGenerate;
export const selectHandleAssist = (state: AppStore) => state.handleAssist;
export const selectHandleGenerateNewsletter = (state: AppStore) => state.handleGenerateNewsletter;
export const selectHandleRetry = (state: AppStore) => state.handleRetry;
export const selectReset = (state: AppStore) => state.reset;
