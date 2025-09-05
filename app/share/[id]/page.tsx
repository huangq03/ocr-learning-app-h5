'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { useParams } from 'next/navigation';

// Define types for the data we expect
interface TextItem {
  id: string;
  content: string;
  // Add other text item properties as needed
}

interface SharedSet {
  id: string;
  title: string;
  items: TextItem[];
}

export default function SharedSetPage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params.id as string;

  const [sharedSet, setSharedSet] = useState<SharedSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/shares/${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(t('share.pageErrorFetch'));
          }
          return res.json();
        })
        .then(data => {
          setSharedSet(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id, t]);

  if (loading) {
    return <div className="container mx-auto p-4">{t('share.pageLoading')}</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{t('share.pageError', { error: error })}</div>;
  }

  if (!sharedSet) {
    return <div className="container mx-auto p-4">{t('share.pageNotFound')}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{sharedSet.title}</h1>
      <div className="space-y-2">
        {sharedSet.items.map(item => (
          <div key={item.id} className="p-4 border rounded-md bg-gray-50">
            <p>{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
