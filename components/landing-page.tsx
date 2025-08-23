'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BookOpen, ScanText, Ear } from 'lucide-react';
import LanguageSwitcher from './language-switcher';

export default function LandingPage() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">{t('landingPage.title')}</h1>
          </Link>
          <nav className="flex items-center">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button variant="ghost">{t('landingPage.login')}</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="ml-2">{t('landingPage.signUp')}</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              {t('landingPage.heroTitle')}
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              {t('landingPage.heroSubtitle')}
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/auth/sign-up">
                  <Button size="lg">{t('landingPage.getStarted')}</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-3xl font-extrabold text-gray-900">{t('landingPage.featuresTitle')}</h3>
              <p className="mt-4 text-lg text-gray-500">
                {t('landingPage.featuresSubtitle')}
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white">
                    <ScanText />
                  </div>
                  <CardTitle className="mt-4">{t('landingPage.feature1Title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    {t('landingPage.feature1Text')}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white">
                    <CheckCircle />
                  </div>
                  <CardTitle className="mt-4">{t('landingPage.feature2Title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    {t('landingPage.feature2Text')}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white">
                    <Ear />
                  </div>
                  <CardTitle className="mt-4">{t('landingPage.feature3Title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    {t('landingPage.feature3Text')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-white border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>{t('landingPage.footerText', { year: currentYear })}</p>
        </div>
      </footer>
    </div>
  );
}
