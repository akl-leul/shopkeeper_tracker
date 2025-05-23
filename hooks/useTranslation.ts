import { useLanguage } from '@/context/LanguageContext';
import translations from '@/data/translations';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Get the translation for the current language
    const langTranslations = translations[language] || translations.en;
    
    // Get the translation for the key
    let translation = langTranslations[key] || translations.en[key] || key;
    
    // Replace parameters in the translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translation;
  };
  
  return t;
};