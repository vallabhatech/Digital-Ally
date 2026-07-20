import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LANGUAGES } from '@/shared/constants';
import { AiProcessingMode, loadPrivacyPreference } from '@/shared/privacy';
import { GeminiHealthStatus } from '@/services/geminiService';

interface AppState {
  privacyMode: AiProcessingMode | null;
  userName: string;
  businessName: string;
  userEmail: string;
  userPhone: string;
  prompt: string;
  modificationPrompt: string;
  selectedPalette: string;
  generatedCode: string;
  generatedUrl: string;
  newsletter: string;
  isGeneratingPost: boolean;
  pageState: 'form' | 'loading' | 'result' | 'dashboard' | 'admin';
  language: string;
  error: string | null;
  services: string;
  location: string;
  themeColor: string;
  lastPrompt: string;
  retryCount: number;
  healthStatus: GeminiHealthStatus;

  setPrivacyModeState: (mode: AiProcessingMode | null) => void;
  setUserName: (val: string) => void;
  setBusinessName: (val: string) => void;
  setUserEmail: (val: string) => void;
  setUserPhone: (val: string) => void;
  setPrompt: (val: string) => void;
  setModificationPrompt: (val: string) => void;
  setSelectedPalette: (val: string) => void;
  setGeneratedCode: (val: string) => void;
  setGeneratedUrl: (val: string) => void;
  setNewsletter: (val: string) => void;
  setIsGeneratingPost: (val: boolean) => void;
  setPageState: (val: 'form' | 'loading' | 'result' | 'dashboard' | 'admin') => void;
  setLanguage: (val: string) => void;
  setError: (val: string | null) => void;
  setServices: (val: string) => void;
  setLocation: (val: string) => void;
  setThemeColor: (val: string) => void;
  setLastPrompt: (val: string) => void;
  setRetryCount: (val: number | ((prev: number) => number)) => void;
  setHealthStatus: (val: GeminiHealthStatus) => void;
  resetApp: () => void;
}

const initialState = {
  privacyMode: loadPrivacyPreference()?.mode || null,
  userName: '',
  businessName: '',
  userEmail: '',
  userPhone: '',
  prompt: '',
  modificationPrompt: '',
  selectedPalette: '',
  generatedCode: '',
  generatedUrl: '',
  newsletter: '',
  isGeneratingPost: false,
  pageState: 'form' as const,
  language: LANGUAGES[0].value,
  error: null,
  services: '',
  location: '',
  themeColor: '#10b981',
  lastPrompt: '',
  retryCount: 0,
  healthStatus: { ok: true, checked: false, retrying: true, message: '' },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setPrivacyModeState: (mode) => set({ privacyMode: mode }),
      setUserName: (userName) => set({ userName }),
      setBusinessName: (businessName) => set({ businessName }),
      setUserEmail: (userEmail) => set({ userEmail }),
      setUserPhone: (userPhone) => set({ userPhone }),
      setPrompt: (prompt) => set({ prompt }),
      setModificationPrompt: (modificationPrompt) => set({ modificationPrompt }),
      setSelectedPalette: (selectedPalette) => set({ selectedPalette }),
      setGeneratedCode: (generatedCode) => set({ generatedCode }),
      setGeneratedUrl: (generatedUrl) => set({ generatedUrl }),
      setNewsletter: (newsletter) => set({ newsletter }),
      setIsGeneratingPost: (isGeneratingPost) => set({ isGeneratingPost }),
      setPageState: (pageState) => set({ pageState }),
      setLanguage: (language) => set({ language }),
      setError: (error) => set({ error }),
      setServices: (services) => set({ services }),
      setLocation: (location) => set({ location }),
      setThemeColor: (themeColor) => set({ themeColor }),
      setLastPrompt: (lastPrompt) => set({ lastPrompt }),
      setRetryCount: (val) => set((state) => ({ retryCount: typeof val === 'function' ? val(state.retryCount) : val })),
      setHealthStatus: (healthStatus) => set({ healthStatus }),
      resetApp: () => set({ ...initialState, privacyMode: loadPrivacyPreference()?.mode || null }),
    }),
    {
      name: 'digital-ally-storage',
      partialize: (state) => ({ language: state.language }), // only persist language for now
    }
  )
);
