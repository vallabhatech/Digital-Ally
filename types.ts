export interface AppContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  businessName: string;
  setBusinessName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  selectedPalette: string;
  setSelectedPalette: (palette: string) => void;
  generatedCode: string;
  pageState: 'form' | 'loading' | 'result' | 'dashboard';
  setPageState: (state: 'form' | 'loading' | 'result' | 'dashboard') => void;
  language: string;
  setLanguage: (lang: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleGenerate: () => Promise<void>;
  reset: () => void;
  t: (key: string) => string;
  modificationPrompt: string;
  setModificationPrompt: (prompt: string) => void;
  handleAssist: () => Promise<void>;
  generatedUrl: string;
  newsletter: string;
  isGeneratingPost: boolean;
  handleGenerateNewsletter: () => Promise<void>;
  handleSelectExample: (prompt: string) => void;
}

export enum OutputView {
  Preview = 'preview',
  Code = 'code',
}
