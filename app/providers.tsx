'use client';

import { I18nextProvider } from 'react-i18next';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import i18n from '@/i18n';
import SiteHeader from '@/components/site-header';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </div>
      </NextThemesProvider>
    </I18nextProvider>
  );
}
