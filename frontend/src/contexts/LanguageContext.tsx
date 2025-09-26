import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from '../locales/en.json';
import zhTranslations from '../locales/zh.json';
import trTranslations from '../locales/tr.json';

// Types
interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: any) => string;
  availableLanguages: Language[];
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Available languages
const availableLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      zh: { translation: zhTranslations },
      tr: { translation: trTranslations },
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  useEffect(() => {
    // Set language in i18next
    i18n.changeLanguage(currentLanguage);
    
    // Update document language
    document.documentElement.lang = currentLanguage;
    
    // Update document direction for RTL languages (future Arabic support)
    if (currentLanguage === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLanguage]);

  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
  };

  const t = (key: string, options?: any): string => {
    return i18n.t(key, options) as string;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// Hook
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
