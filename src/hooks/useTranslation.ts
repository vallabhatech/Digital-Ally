import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TRANSLATIONS } from '../shared/constants';

export type TranslationKey = keyof typeof TRANSLATIONS['en-US'];

export function useTranslation() {
  const language = useAppStore((state) => state.language);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let message = TRANSLATIONS[language]?.[key] || TRANSLATIONS['en-US'][key] || (key as string);
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          message = message.replace(`{${paramKey}}`, String(paramValue));
        }
      }
      return message;
    },
    [language]
  );

  return { t };
}
