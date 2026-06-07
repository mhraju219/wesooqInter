'use client';

import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Globe } from 'lucide-react';

interface AdminHeaderProps {
  user: { email: string; role: string };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();

  const handleLanguageToggle = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
    window.location.reload();
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3 md:px-8 md:py-4">
        <div>
          <h1 className="text-lg font-semibold">Admin Portal</h1>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="default" onClick={handleLanguageToggle} className="gap-2">
            {locale === 'en' ? '🇸🇦 العربية' : '🇺🇸 English'}
          </Button>
        </div>
      </div>
    </header>
  );
}