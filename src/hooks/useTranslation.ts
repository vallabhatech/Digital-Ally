import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TRANSLATIONS } from '../shared/constants';

export function useTranslation() {
  const language = useAppStore((state) => state.language);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let message = TRANSLATIONS[language]?.[key] || TRANSLATIONS['en-US'][key] || key;
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
