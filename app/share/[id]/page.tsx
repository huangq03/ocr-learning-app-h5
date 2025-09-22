'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { useToast } from '@/components/ui/use-toast';
import DictationInterface from '@/components/dictation-interface';
import StudyInterface from '@/components/study-interface';
import { DocumentItemsCard } from '@/components/document-items-card';
import { getStudyPageData, getDictationPageData } from '@/lib/actions';

interface TextItem {
  id: string;
  content: string;
}

interface SharedSet {
  id: string;
  title: string;
  items: TextItem[];
}

type ViewState = 'recitation' | 'dictation' | '';

export default function SharedSetPage() {
  const { t } = useTranslation();
  const params = useParams();
  const { toast } = useToast();
  const shareId = params.id as string;

  const [sharedSet, setSharedSet] = useState<SharedSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewState>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sessionItems, setSessionItems] = useState<any[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  useEffect(() => {
    if (shareId) {
      fetch(`/api/shares/${shareId}`)
        .then(res => {
          if (!res.ok) throw new Error(t('share.pageErrorFetch'));
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
  }, [shareId, t]);

  const handleStartSession = async (type: 'recitation' | 'dictation') => {
    if (selectedItems.length === 0) {
      toast({ title: <span className="text-white">{t('selectItemsAlert')}</span>, variant: 'destructive' });
      return;
    }

    setIsSessionLoading(true);
    let data;
    if (type === 'dictation') {
      data = await getDictationPageData({ shareId: shareId, studySessionItems: selectedItems });
    } else {
      data = await getStudyPageData({ shareId: shareId, studySessionItems: selectedItems });
    }

    if (data.error) {
      setError(data.error);
    } else {
      setSessionItems(data.items || []);
      setView(type);
    }
    setIsSessionLoading(false);
  };

  if (loading || isSessionLoading) {
    return <div className="container mx-auto p-4 text-center">{t('share.pageLoading')}</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{t('share.pageError', { error: error })}</div>;
  }

  if (!sharedSet) {
    return <div className="container mx-auto p-4 text-center">{t('share.pageNotFound')}</div>;
  }

  if (view === 'dictation') {
    return <DictationInterface items={sessionItems} shareId={shareId} />
  }

  if (view === 'recitation') {
    return <StudyInterface initialItems={sessionItems} shareId={shareId} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <DocumentItemsCard
          title={sharedSet.title}
          plainItems={sharedSet.items.map(item => item.content)}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          handleStartSession={handleStartSession}
          isLoading={false}
        />
      </div>
    </div>
  );
}
