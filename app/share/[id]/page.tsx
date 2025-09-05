'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Headphones } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DictationInterface from '@/components/dictation-interface';
import StudyInterface from '@/components/study-interface';

interface TextItem {
  id: string;
  content: string;
}

interface SharedSet {
  id: string;
  title: string;
  items: TextItem[];
}

type SessionType = 'dictation' | 'study';
type ViewState = 'selection' | SessionType;

export default function SharedSetPage() {
  const { t } = useTranslation();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const [sharedSet, setSharedSet] = useState<SharedSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<ViewState>('selection');
  const [selectedItems, setSelectedItems] = useState<TextItem[]>([]);

  useEffect(() => {
    if (id) {
      fetch(`/api/shares/${id}`)
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
  }, [id, t]);

  const handleToggleAll = (checked: boolean) => {
    if (checked && sharedSet) {
        const sortedItems = [...sharedSet.items].sort((a, b) => a.content.localeCompare(b.content));
        setSelectedItems(sortedItems);
    } else {
        setSelectedItems([]);
    }
  };

  const handleToggleItem = (item: TextItem, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, item].sort((a, b) => a.content.localeCompare(b.content)));
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handleStartSession = (type: SessionType) => {
    if (selectedItems.length === 0) {
      toast({ title: <span className="text-white">{t('selectItemsAlert')}</span>, variant: 'destructive' });
      return;
    }
    setView(type);
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">{t('share.pageLoading')}</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">{t('share.pageError', { error: error })}</div>;
  }

  if (!sharedSet) {
    return <div className="container mx-auto p-4 text-center">{t('share.pageNotFound')}</div>;
  }

  if (view === 'dictation') {
    return <DictationInterface textItems={selectedItems} shareId={id} />
  }

  if (view === 'study') {
    return <StudyInterface initialItems={selectedItems} shareId={id} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">{sharedSet.title}</CardTitle>
            <p className="text-gray-500">{t('createStudySessionSubtitle')}</p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedItems.length > 0 && selectedItems.length === sharedSet.items.length}
                  onCheckedChange={handleToggleAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">{t('selectAllItems')}</label>
              </div>
              <ScrollArea className="h-64 w-full border-t pt-4">
                <div className="space-y-2">
                  {sharedSet.items.map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`item-${index}`}
                        checked={selectedItems.some(si => si.id === item.id)}
                        onCheckedChange={(checked) => handleToggleItem(item, !!checked)}
                      />
                      <label htmlFor={`item-${index}`} className="text-sm">{item.content}</label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={() => handleStartSession('study')} className="bg-blue-600 hover:bg-blue-700">
                <BookOpen className="w-5 h-5 mr-2" />
                {t('startRecitation')}
              </Button>
              <Button onClick={() => handleStartSession('dictation')} className="bg-purple-600 hover:bg-purple-700">
                <Headphones className="w-5 h-5 mr-2" />
                {t('startDictation')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}