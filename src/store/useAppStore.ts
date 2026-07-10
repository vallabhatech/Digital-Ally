import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  checkGeminiHealth,
  generateNewsletter,
  generateWebsite,
} from '@/features/generation/geminiService';
import { LANGUAGES, TRANSLATIONS } from '@/shared/constants';
import {
  clearPrivacyPreference,
  loadPrivacyPreference,
  savePrivacyPreference,
} from '@/shared/privacy';
import type {
  AppStore,
  AppStoreData,
  GenerationState,
  HealthStatus,
  StoreFieldKey,
  StoreFieldValueMap,
} from '@/shared/types';
import {
  modificationSchema,
  newsletterFormSchema,
  sanitizeFormData,
  validateSchema,
  websiteFormSchema,
} from '@/shared/validation';

const initialHealthStatus: HealthStatus = {
  ok: true,
  checked: false,
  retrying: false,
  message: '',
};

const initialGenerationState: GenerationState = {
  generatedCode: '',
  generatedUrl: '',
  newsletter: '',
  isGeneratingPost: false,
};

const createInitialData = (): AppStoreData => ({
  privacyMode: typeof window !== 'undefined' ? loadPrivacyPreference()?.mode || null : null,
  user: {
    name: '',
    email: '',
    phone: '',
  },
  business: {
    name: '',
    services: '',
    location: '',
  },
  draft: {
    prompt: '',
    modificationPrompt: '',
    selectedPalette: '',
    themeColor: '#10b981',
  },
  generation: { ...initialGenerationState },
  ui: {
    pageState: 'form',
    language: LANGUAGES[0]?.value || 'en-US',
    error: null,
    lastPrompt: '',
    retryCount: 0,
    healthStatus: { ...initialHealthStatus },
  },
});

const mapFieldUpdate = <K extends StoreFieldKey>(
  state: AppStore,
  key: K,
  value: StoreFieldValueMap[K]
): Partial<AppStoreData> => {
  switch (key) {
    case 'userName':
      return { user: { ...state.user, name: value as string } };
    case 'businessName':
      return { business: { ...state.business, name: value as string } };
    case 'userEmail':
      return { user: { ...state.user, email: value as string } };
    case 'userPhone':
      return { user: { ...state.user, phone: value as string } };
    case 'prompt':
      return { draft: { ...state.draft, prompt: value as string } };
    case 'modificationPrompt':
      return { draft: { ...state.draft, modificationPrompt: value as string } };
    case 'selectedPalette':
      return { draft: { ...state.draft, selectedPalette: value as string } };
    case 'services':
      return { business: { ...state.business, services: value as string } };
    case 'location':
      return { business: { ...state.business, location: value as string } };
    case 'themeColor':
      return { draft: { ...state.draft, themeColor: value as string } };
    case 'language':
      return { ui: { ...state.ui, language: value as string } };
    case 'pageState':
      return { ui: { ...state.ui, pageState: value as AppStoreData['ui']['pageState'] } };
    case 'error':
      return { ui: { ...state.ui, error: value as string | null } };
    default:
      return {};
  }
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createInitialData(),

      setField: (key, value) =>
        set((state) => ({
          ...mapFieldUpdate(state, key, value),
        })),

      t: (key, params) => {
        const { ui } = get();
        let message = TRANSLATIONS[ui.language]?.[key] || TRANSLATIONS['en-US']?.[key] || key;
        if (params) {
          for (const [paramKey, paramValue] of Object.entries(params)) {
            message = message.replace(`{${paramKey}}`, String(paramValue));
          }
        }
        return message;
      },

      setPrivacyMode: (mode) => {
        savePrivacyPreference(mode);
        set((state) => ({ privacyMode: mode, ui: { ...state.ui, error: null } }));
      },

      handleSelectExample: (examplePrompt) => {
        set((state) => ({
          draft: { ...state.draft, prompt: examplePrompt },
          ui: { ...state.ui, pageState: 'form' },
        }));
      },

      checkHealth: async () => {
        set((state) => ({
          ui: {
            ...state.ui,
            healthStatus: {
              ...state.ui.healthStatus,
              retrying: true,
            },
          },
        }));

        try {
          const result = await checkGeminiHealth();
          set((state) => ({
            ui: {
              ...state.ui,
              healthStatus: result,
            },
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unable to verify backend health.';
          set((state) => ({
            ui: {
              ...state.ui,
              healthStatus: {
                ok: false,
                checked: true,
                retrying: false,
                message,
              },
            },
          }));
        }
      },

      handleGenerate: async () => {
        const s = get();
        const formData = sanitizeFormData({
          userName: s.user.name,
          businessName: s.business.name,
          userEmail: s.user.email,
          userPhone: s.user.phone,
          prompt: s.draft.prompt,
          services: s.business.services,
          location: s.business.location,
          themeColor: s.draft.themeColor,
          selectedPalette: s.draft.selectedPalette,
        });

        const validation = validateSchema(websiteFormSchema, formData, s.t);
        if (validation.success === false) {
          set((state) => ({ ui: { ...state.ui, error: validation.firstError } }));
          return;
        }

        set((state) => ({
          ui: { ...state.ui, lastPrompt: s.draft.prompt, pageState: 'loading', error: null },
          generation: { ...state.generation, generatedUrl: '', newsletter: '' },
        }));

        const result = await generateWebsite({
          formData: validation.data,
          onRetry: (attempt, err) => {
            set((state) => ({
              ui: { ...state.ui, retryCount: attempt, error: err.message },
            }));
          },
        });

        if (result.success === false) {
          set((state) => ({
            ui: {
              ...state.ui,
              error: `Failed to generate website: ${result.error}`,
              pageState: 'result',
              retryCount: state.ui.retryCount + 1,
            },
          }));
        } else if (result.code.trim().toLowerCase().startsWith('<!doctype html')) {
          set((state) => ({
            generation: {
              ...state.generation,
              generatedCode: result.code,
              generatedUrl: `data:text/html;charset=utf-8,${encodeURIComponent(result.code)}`,
            },
            ui: { ...state.ui, pageState: 'result', retryCount: 0 },
          }));
        } else {
          set((state) => ({
            ui: { ...state.ui, error: s.t('updateFailed'), pageState: 'result' },
          }));
        }
      },

      handleAssist: async () => {
        const s = get();
        const validation = validateSchema(
          modificationSchema,
          sanitizeFormData({ modificationPrompt: s.draft.modificationPrompt }),
          s.t
        );

        if (validation.success === false) {
          set((state) => ({ ui: { ...state.ui, error: validation.firstError } }));
          return;
        }

        set((state) => ({
          ui: { ...state.ui, lastPrompt: s.draft.prompt, pageState: 'loading', error: null },
          generation: { ...state.generation, generatedUrl: '', newsletter: '' },
        }));

        const formData = sanitizeFormData({
          userName: s.user.name,
          businessName: s.business.name,
          userEmail: s.user.email,
          userPhone: s.user.phone,
          prompt: s.draft.prompt,
          services: s.business.services,
          location: s.business.location,
          themeColor: s.draft.themeColor,
          selectedPalette: s.draft.selectedPalette,
        });

        const websiteValidation = validateSchema(websiteFormSchema, formData, s.t);
        if (websiteValidation.success === false) {
          set((state) => ({
            ui: { ...state.ui, error: websiteValidation.firstError, pageState: 'result' },
          }));
          return;
        }

        const result = await generateWebsite({
          formData: websiteValidation.data,
          modificationPrompt: validation.data.modificationPrompt,
          onRetry: (attempt, err) => {
            set((state) => ({
              ui: { ...state.ui, retryCount: attempt, error: err.message },
            }));
          },
        });

        if (result.success === false) {
          set((state) => ({
            ui: {
              ...state.ui,
              error: `Failed to generate website: ${result.error}`,
              pageState: 'result',
            },
          }));
        } else if (result.code.trim().toLowerCase().startsWith('<!doctype html')) {
          set((state) => ({
            generation: {
              ...state.generation,
              generatedCode: result.code,
              generatedUrl: `data:text/html;charset=utf-8,${encodeURIComponent(result.code)}`,
            },
            draft: { ...state.draft, modificationPrompt: '' },
            ui: { ...state.ui, pageState: 'result', retryCount: 0 },
          }));
        } else {
          set((state) => ({
            ui: { ...state.ui, error: s.t('updateFailed'), pageState: 'result' },
            draft: { ...state.draft, modificationPrompt: '' },
          }));
        }
      },

      handleGenerateNewsletter: async () => {
        const s = get();
        const validation = validateSchema(
          newsletterFormSchema,
          sanitizeFormData({
            prompt: s.draft.prompt,
            businessName: s.business.name,
            generatedUrl: s.generation.generatedUrl,
          }),
          s.t
        );

        if (validation.success === false) {
          set((state) => ({ ui: { ...state.ui, error: validation.firstError } }));
          return;
        }

        set((state) => ({
          generation: { ...state.generation, isGeneratingPost: true },
          ui: { ...state.ui, error: null },
        }));

        const result = await generateNewsletter({
          prompt: s.draft.prompt,
          businessName: s.business.name,
        });

        if (result.success === false) {
          set((state) => ({
            ui: { ...state.ui, error: `Failed to generate newsletter: ${result.error}` },
            generation: { ...state.generation, isGeneratingPost: false },
          }));
        } else {
          set((state) => ({
            generation: {
              ...state.generation,
              newsletter: result.newsletterText,
              isGeneratingPost: false,
            },
          }));
        }
      },

      handleRetry: async () => {
        const s = get();
        if (s.ui.retryCount >= 3) {
          set((state) => ({
            ui: {
              ...state.ui,
              error: 'Maximum retry attempts reached. Please try again with different inputs.',
            },
          }));
          return;
        }
        if (s.ui.lastPrompt) {
          set((state) => ({
            draft: { ...state.draft, prompt: s.ui.lastPrompt },
            ui: { ...state.ui, retryCount: state.ui.retryCount + 1 },
          }));
          await s.handleGenerate();
        } else {
          set((state) => ({ ui: { ...state.ui, error: 'No previous prompt to retry.' } }));
        }
      },

      reset: () =>
        set((state) => ({
          user: { name: '', email: '', phone: '' },
          business: { name: '', services: '', location: '' },
          draft: {
            prompt: '',
            modificationPrompt: '',
            selectedPalette: '',
            themeColor: '#10b981',
          },
          generation: { ...initialGenerationState },
          ui: {
            ...state.ui,
            pageState: 'form',
            error: null,
            lastPrompt: '',
            retryCount: 0,
            healthStatus: { ...initialHealthStatus },
          },
        })),

      clearPrivateData: () => {
        get().reset();
        clearPrivacyPreference();
        set({ privacyMode: null });
      },

      reviewPrivacyChoice: () => {
        clearPrivacyPreference();
        set({ privacyMode: null });
      },
    }),
    {
      name: 'digital-ally-state-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        privacyMode: state.privacyMode,
        user: state.user,
        business: state.business,
        draft: {
          prompt: state.draft.prompt,
          selectedPalette: state.draft.selectedPalette,
          themeColor: state.draft.themeColor,
        },
        ui: {
          language: state.ui.language,
        },
      }),
    }
  )
);
