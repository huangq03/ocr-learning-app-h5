'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { BookImage } from 'lucide-react';
import Link from 'next/link';

export default function SiteHeader() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <BookImage className="h-6 w-6 text-purple-600" />
            <span className="font-bold">OCR Learning App</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button size="sm" variant={i18n.language.startsWith('en') ? 'default' : 'outline'} onClick={() => changeLanguage('en')}>EN</Button>
          <Button size="sm" variant={i18n.language.startsWith('zh') ? 'default' : 'outline'} onClick={() => changeLanguage('zh')}>ZH</Button>
        </div>
      </div>
    </header>
  );
}
