'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import ItemGroup from '@/components/item-group';
import { getItemsPageData, getPageSession } from '@/lib/actions';
import type { User } from '@supabase/supabase-js';

export default function ItemsManagementPage() {
  const { t } = useTranslation();
  const [session, setSession] = useState<any>(null);
  const [documents, setDocuments] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { session: pageSession } = await getPageSession();
        setSession(pageSession);

        if (!pageSession) {
          setLoading(false);
          return;
        }

        const { documents: fetchedDocuments, error: fetchError } = await getItemsPageData(pageSession.user.id);

        if (fetchError) {
          setError(t('items.errorLoading'));
        } else {
          setDocuments(fetchedDocuments);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p>{t('items.loading')}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p>{t('items.logInPrompt')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('items.pageTitle')}</h1>
        <div className="space-y-6">
          {documents?.map(doc => (
            <ItemGroup key={doc.id} document={doc as any} />
          ))}
        </div>
      </div>
    </div>
  );
}