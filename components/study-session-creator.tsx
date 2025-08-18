'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Headphones, ArrowLeft, BrainCircuit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  user_id: string;
  created_at: string;
  image_path: string;
  recognized_text: {
    items: string[];
    cleaned_text: string;
  };
}

export default function StudySessionCreator({ document }: { document: Document }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const allItems = document.recognized_text?.items || [];

  const handleToggleAll = (checked: boolean) => {
    setSelectedItems(checked ? allItems : []);
  };

  const handleToggleItem = (item: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, item]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i !== item));
    }
  };

  const handleStartSession = (type: 'recitation' | 'dictation') => {
    if (selectedItems.length === 0) {
      toast({ title: t('selectItemsAlert'), variant: 'destructive' });
      return;
    }
    const studySession = { type, items: selectedItems, documentId: document.id };
    localStorage.setItem('studySession', JSON.stringify(studySession));
    router.push('/study');
  };

  const handleAddToStudyPlan = async () => {
    if (selectedItems.length === 0) {
      toast({ title: t('selectItemsAlert'), variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { data: insertedCount, error } = await supabase.rpc('add_to_study_plan', {
      p_user_id: document.user_id,
      p_document_id: document.id,
      p_items: selectedItems,
    });

    setIsLoading(false);
    if (error) {
      console.error('Error adding items to study plan:', error);
      toast({ title: t('errorAddToStudyPlan'), description: error.message, variant: 'destructive' });
    } else {
      if (insertedCount > 0) {
        toast({ title: t('successAddToStudyPlan'), description: t('successAddToStudyPlanDesc', { count: insertedCount }) });
      } else {
        toast({ title: t('noNewItemsAdded'), description: t('noNewItemsAddedDesc') });
      }
      setSelectedItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backButton')}
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">{t('createStudySessionTitle')}</CardTitle>
            <p className="text-gray-500">{t('createStudySessionSubtitle')}</p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedItems.length > 0 && selectedItems.length === allItems.length}
                  onCheckedChange={handleToggleAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">{t('selectAllItems')}</label>
              </div>
              <ScrollArea className="h-64 w-full border-t pt-4">
                <div className="space-y-2">
                  {allItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`item-${index}`}
                        checked={selectedItems.includes(item)}
                        onCheckedChange={(checked) => handleToggleItem(item, !!checked)}
                      />
                      <label htmlFor={`item-${index}`} className="text-sm">{item}</label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button onClick={() => handleStartSession('recitation')} className="bg-blue-600 hover:bg-blue-700">
                <BookOpen className="w-5 h-5 mr-2" />
                {t('startRecitation')}
              </Button>
              <Button onClick={() => handleStartSession('dictation')} className="bg-purple-600 hover:bg-purple-700">
                <Headphones className="w-5 h-5 mr-2" />
                {t('startDictation')}
              </Button>
              <Button onClick={handleAddToStudyPlan} disabled={isLoading} className="sm:col-span-2 bg-green-600 hover:bg-green-700">
                <BrainCircuit className="w-5 h-5 mr-2" />
                {isLoading ? t('addingToStudyPlan') : t('addToStudyPlan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
