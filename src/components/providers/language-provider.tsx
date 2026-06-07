'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type LanguageContextType = {
  locale: string;
  setLocale: (locale: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  const setLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    setLocaleState(newLocale);
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
    localStorage.setItem('locale', newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved === 'en' || saved === 'ar') {
      setLocale(saved);
    } else {
      // Optionally read cookie if exists
      const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      if (cookieMatch && (cookieMatch[1] === 'en' || cookieMatch[1] === 'ar')) {
        setLocale(cookieMatch[1]);
      } else {
        setLocale('en');
      }
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};