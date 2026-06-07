import { Inter, Cairo } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { NextAuthSessionProvider } from '@/components/providers/session-provider';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No server‑side locale – the client will set dir and lang.
  // Default to LTR and English until client code runs.
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body>
        <NextAuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <LanguageProvider>
              <Header />
              {children}
              <Toaster richColors position="top-right" />
            </LanguageProvider>
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}