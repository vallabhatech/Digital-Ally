import type { AiProcessingMode } from '@/shared/privacy';

export type PageState = 'form' | 'loading' | 'result' | 'dashboard';

export interface HealthStatus {
  ok: boolean;
  checked: boolean;
  retrying: boolean;
  message: string;
}

export interface UserState {
  name: string;
  email: string;
  phone: string;
}

export interface BusinessState {
  name: string;
  services: string;
  location: string;
}

export interface DraftState {
  prompt: string;
  modificationPrompt: string;
  selectedPalette: string;
  themeColor: string;
}

export interface GenerationState {
  generatedCode: string;
  generatedUrl: string;
  newsletter: string;
  isGeneratingPost: boolean;
}

export interface UiState {
  pageState: PageState;
  language: string;
  error: string | null;
  lastPrompt: string;
  retryCount: number;
  healthStatus: HealthStatus;
}

export interface AppStoreData {
  privacyMode: AiProcessingMode | null;
  user: UserState;
  business: BusinessState;
  draft: DraftState;
  generation: GenerationState;
  ui: UiState;
}

export type StoreFieldKey =
  | 'userName'
  | 'businessName'
  | 'userEmail'
  | 'userPhone'
  | 'prompt'
  | 'modificationPrompt'
  | 'selectedPalette'
  | 'pageState'
  | 'language'
  | 'error'
  | 'services'
  | 'location'
  | 'themeColor';

export interface StoreFieldValueMap {
  userName: string;
  businessName: string;
  userEmail: string;
  userPhone: string;
  prompt: string;
  modificationPrompt: string;
  selectedPalette: string;
  pageState: PageState;
  language: string;
  error: string | null;
  services: string;
  location: string;
  themeColor: string;
}

export type TranslationFn = (key: string, params?: Record<string, string | number>) => string;

export interface AppStoreActions {
  setField: <K extends StoreFieldKey>(key: K, value: StoreFieldValueMap[K]) => void;
  setPrivacyMode: (mode: AiProcessingMode) => void;
  clearPrivateData: () => void;
  reviewPrivacyChoice: () => void;
  handleSelectExample: (prompt: string) => void;
  checkHealth: () => Promise<void>;
  handleGenerate: () => Promise<void>;
  handleAssist: () => Promise<void>;
  handleGenerateNewsletter: () => Promise<void>;
  handleRetry: () => Promise<void>;
  reset: () => void;
  t: TranslationFn;
}

export type AppStore = AppStoreData & AppStoreActions;

// Kept as a compatibility alias for the expected architecture path.
export type AppContextType = AppStore;

export enum OutputView {
  Preview = 'preview',
  Code = 'code',
}
