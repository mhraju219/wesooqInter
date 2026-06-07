'use client';

import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
  business: { name: any; slug: string; logo?: string | null } | null;
  user: { email: string; role: string };
}

export function DashboardHeader({ business, user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();

  const handleLanguageToggle = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
    // Force reload to let server components read the updated cookie
    window.location.reload();
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3 md:px-8 md:py-4">
        <div>
          {business && (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {business.name[locale] || business.name.en}
            </h1>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.role} • {user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="default"
            onClick={handleLanguageToggle}
            className="gap-2"
          >
            {locale === 'en' ? (
              <>
                <span className="text-xl">🇸🇦</span>
                <span className="hidden sm:inline">العربية</span>
              </>
            ) : (
              <>
                <span className="text-xl">🇺🇸</span>
                <span className="hidden sm:inline">English</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}