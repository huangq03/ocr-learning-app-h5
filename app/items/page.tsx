'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/i18n';
import ItemGroup from '@/components/item-group';
import { getItemsPageData, getPageSession } from '@/lib/actions';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function ItemsManagementContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

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

        const { documents: fetchedDocuments, error: fetchError } = await getItemsPageData(filter);

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
  }, [t, filter]);

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

  const pageTitle = filter === 'mastered' ? t('items.masteredItemsTitle') : t('items.pageTitle');

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('documents.backToDashboard')}
            </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{pageTitle}</h1>
        <div className="space-y-6">
          {documents && documents.length > 0 ? (
            documents.map(doc => (
              <ItemGroup key={doc.id} document={doc as any} />
            ))
          ) : (
            <p>{t('items.noItemsFound')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ItemsManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItemsManagementContent />
    </Suspense>
  );
}
