import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useGeneration } from "@/hooks/useGeneration";
import { LANGUAGES, TRANSLATIONS } from "@/shared/constants";
import { AiProcessingMode, clearPrivacyPreference, loadPrivacyPreference, savePrivacyPreference } from "@/shared/privacy";
import {
  modificationSchema,
  newsletterFormSchema,
  sanitizeFormData,
  validateSchema,
} from "@/shared/validation";

// Define the full strict TypeScript interface state contract
interface AppState {
  // Pure State Values
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
  pageState: "form" | "loading" | "result" | "dashboard";
  language: string;
  error: string | null;
  services: string;
  location: string;
  themeColor: string;
  lastPrompt: string;
  retryCount: number;

  // Actions Mutators
  setField: <K extends keyof AppState>(key: K, value: AppState[K]) => void;
  setPrivacyMode: (mode: AiProcessingMode) => void;
  clearPrivateData: () => void;
  reviewPrivacyChoice: () => void;
  handleSelectExample: (examplePrompt: string) => void;
  reset: () => void;
  
  // Custom Hook Functional Pipeline Proxies
  t: (key: string, params?: Record<string, string | number>) => string;
  handleGenerate: () => Promise<void>;
  handleAssist: () => Promise<void>;
  handleGenerateNewsletter: () => Promise<void>;
  handleRetry: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Default State Initializers ---
      privacyMode: typeof window !== "undefined" ? loadPrivacyPreference()?.mode || null : null,
      userName: "",
      businessName: "",
      userEmail: "",
      userPhone: "",
      prompt: "",
      modificationPrompt: "",
      selectedPalette: "",
      generatedCode: "",
      generatedUrl: "",
      newsletter: "",
      isGeneratingPost: false,
      pageState: "form",
      language: LANGUAGES[0]?.value || "en-US",
      error: null,
      services: "",
      location: "",
      themeColor: "#10b981",
      lastPrompt: "",
      retryCount: 0,

      // --- Centralized Setter Mutator ---
      setField: (key, value) => set({ [key]: value }),

      // --- Localization Translation Method ---
      t: (key, params) => {
        const { language } = get();
        let message = TRANSLATIONS[language]?.[key] || TRANSLATIONS["en-US"]?.[key] || key;
        if (params) {
          for (const [paramKey, paramValue] of Object.entries(params)) {
            message = message.replace(`{${paramKey}}`, String(paramValue));
          }
        }
        return message;
      },

      setPrivacyMode: (mode) => {
        savePrivacyPreference(mode);
        set({ privacyMode: mode, error: null });
      },

      handleSelectExample: (examplePrompt) => {
        set({ prompt: examplePrompt, pageState: "form" });
      },

      // --- Generation Workflows Operations Pipeline ---
      handleGenerate: async () => {
        const s = get();
        const formData = sanitizeFormData({
          userName: s.userName,
          businessName: s.businessName,
          userEmail: s.userEmail,
          userPhone: s.userPhone,
          prompt: s.prompt,
          services: s.services,
          location: s.location,
          themeColor: s.themeColor,
          selectedPalette: s.selectedPalette,
        });

        set({ lastPrompt: s.prompt, pageState: "loading", error: null, generatedUrl: "", newsletter: "" });

        // Instantiating hook execution flow matching context behavior
        const { generateWebsiteContent } = useGeneration({ t: s.t });
        const result = await generateWebsiteContent(formData, undefined, {
          onRetry: (attempt, err) => {
            set({ retryCount: attempt, error: err.message });
          },
        });

        if (result && "error" in result) {
          set({ error: `Failed to generate website: ${result.error}`, pageState: "result" });
          set((prev) => ({ retryCount: prev.retryCount + 1 }));
        } else if (result && result.code?.trim().toLowerCase().startsWith("<!doctype html")) {
          set({
            generatedCode: result.code,
            pageState: "result",
            generatedUrl: `data:text/html;charset=utf-8,${encodeURIComponent(result.code)}`,
            retryCount: 0,
          });
        } else {
          set({ error: s.t("updateFailed"), pageState: "result" });
        }
      },

      handleAssist: async () => {
        const s = get();
        const validation = validateSchema(
  modificationSchema,
  sanitizeFormData({ modificationPrompt: s.modificationPrompt }),
  s.t
) as { success: boolean; data: { modificationPrompt: string }; firstError: string };

        if (validation.success === false) {
          set({ error: validation.firstError });
          return;
        }

        set({ lastPrompt: s.prompt, pageState: "loading", error: null, generatedUrl: "", newsletter: "" });
        const { generateWebsiteContent } = useGeneration({ t: s.t });
        
        const formData = sanitizeFormData({
          userName: s.userName,
          businessName: s.businessName,
          userEmail: s.userEmail,
          userPhone: s.userPhone,
          prompt: s.prompt,
          services: s.services,
          location: s.location,
          themeColor: s.themeColor,
          selectedPalette: s.selectedPalette,
        });

        const result = await generateWebsiteContent(formData, validation.data.modificationPrompt, {
          onRetry: (attempt, err) => {
            set({ retryCount: attempt, error: err.message });
          },
        });

        if (result && "error" in result) {
          set({ error: `Failed to generate website: ${result.error}`, pageState: "result" });
        } else if (result && result.code?.trim().toLowerCase().startsWith("<!doctype html")) {
          set({
            generatedCode: result.code,
            pageState: "result",
            generatedUrl: `data:text/html;charset=utf-8,${encodeURIComponent(result.code)}`,
            modificationPrompt: "",
            retryCount: 0,
          });
        } else {
          set({ error: s.t("updateFailed"), pageState: "result", modificationPrompt: "" });
        }
      },

      handleGenerateNewsletter: async () => {
        const s = get();
        const validation = validateSchema(
          newsletterFormSchema,
          sanitizeFormData({ prompt: s.prompt, businessName: s.businessName, generatedUrl: s.generatedUrl }),
          s.t
        );

        if (validation.success === false) {
          set({ error: validation.firstError });
          return;
        }

        set({ isGeneratingPost: true, error: null });
        const { generateNewsletterContent } = useGeneration({ t: s.t });
        const result = await generateNewsletterContent({ prompt: s.prompt, businessName: s.businessName });

        if (result && "error" in result) {
          set({ error: `Failed to generate newsletter: ${result.error}`, isGeneratingPost: false });
        } else {
          set({ newsletter: result.newsletterText, isGeneratingPost: false });
        }
      },

      handleRetry: async () => {
        const s = get();
        if (s.retryCount >= 3) {
          set({ error: "Maximum retry attempts reached. Please try again with different inputs." });
          return;
        }
        if (s.lastPrompt) {
          set({ prompt: s.lastPrompt });
          set((prev) => ({ retryCount: prev.retryCount + 1 }));
          await s.handleGenerate();
        } else {
          set({ error: "No previous prompt to retry." });
        }
      },

      // --- Cleanup Actions Resetters ---
      reset: () => set({
        prompt: "",
        userName: "",
        businessName: "",
        userEmail: "",
        userPhone: "",
        selectedPalette: "",
        generatedCode: "",
        generatedUrl: "",
        newsletter: "",
        isGeneratingPost: false,
        modificationPrompt: "",
        error: null,
        pageState: "form",
        lastPrompt: "",
        retryCount: 0,
        services: "",
        location: "",
        themeColor: "#10b981",
      }),

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
      name: "digital-ally-state-storage", // local persistence key name
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Selectively pick which values should persist in localStorage
        userName: state.userName,
        businessName: state.businessName,
        userEmail: state.userEmail,
        userPhone: state.userPhone,
        language: state.language,
      }),
    }
  )
);