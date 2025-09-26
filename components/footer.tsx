
'use client';

import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 bg-white border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
        <p>{t('landingPage.footerText', { year: currentYear })}</p>
        <p><a href="https://beian.miit.gov.cn/" target="_blank">{t('icpBeian')}</a></p>
      </div>
    </footer>
  );
}
