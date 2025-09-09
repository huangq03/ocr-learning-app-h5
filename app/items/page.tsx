'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/i18n';
import ItemGroup from '@/components/item-group';
import { getItemsPageData, getPageSession } from '@/lib/actions';
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
      setLoading(true);
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

  const pageTitle = filter === 'mastered' ? t('items.masteredItemsTitle') : t('items.pageTitle');

  if (loading) {
    return <div className="p-8 text-center">{t('items.loading')}</div>;
  }

  if (!session) {
    return <div className="p-8 text-center">{t('items.logInPrompt')}</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('documents.backToDashboard')}
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{pageTitle}</h1>

        <div className="flex space-x-1 border-b mb-4">
          <Button variant={!filter ? 'ghost' : 'ghost'} className={`border-b-2 ${!filter ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`} onClick={() => router.push('/items')}>
            {t('items.pageTitle')}
          </Button>
          <Button variant={filter === 'mastered' ? 'ghost' : 'ghost'} className={`border-b-2 ${filter === 'mastered' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`} onClick={() => router.push('/items?filter=mastered')}>
            {t('items.masteredItemsTitle')}
          </Button>
        </div>

        <div className="space-y-6">
          {documents && documents.length > 0 ? (
            documents.map(doc => (
              <ItemGroup key={doc.id} document={doc} />
            ))
          ) : (
            <p className="p-8 text-center text-gray-500">{t('items.noItemsFound')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ItemsManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ItemsManagementContent />
    </Suspense>
  );
}
