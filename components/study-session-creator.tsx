'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Headphones, ArrowLeft, BrainCircuit, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { useToast } from '@/hooks/use-toast';
import { addToStudyPlanAction, getWordsDataAction } from '@/lib/actions';
import { playAudio } from '@/lib/audio-player';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditableTitle } from '@/components/editable-title';
import { Document, DocumentItemsCard } from '@/components/document-items-card';


export default function StudySessionCreator({ document }: { document: Document }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);


  const handleToggleItem = (item: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, item]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i !== item));
    }
  };

  const handleStartSession = async (type: 'recitation' | 'dictation') => {
    if (selectedItems.length === 0) {
      toast({ title: <span className="text-white">{t('selectItemsAlert')}</span>, variant: 'destructive' });
      return;
    }

    const { insertedItems, error } = await addToStudyPlanAction(document.id, selectedItems);

    if (error) {
      toast({ title: <span className="text-white">{t('errorAddToStudyPlan')}</span>, description: <span className="text-white">{error}</span>, variant: 'destructive' });
      return;
    }

    const studySession = { type, items: selectedItems, documentId: document.id };
    localStorage.setItem('studySession', JSON.stringify(studySession));
    if (type === 'dictation') {
      router.push('/dictation');
    } else {
      router.push('/study');
    }
  };

  const handleAddToStudyPlan = async () => {
    if (selectedItems.length === 0) {
      toast({ title: <span className="text-white">{t('selectItemsAlert')}</span>, variant: 'destructive' });
      return;
    }

    const { insertedCount, error } = await addToStudyPlanAction(document.id, selectedItems);
    if (error) {
      toast({ title: <span className="text-white">{t('errorAddToStudyPlan')}</span>, description: <span className="text-white">{error}</span>, variant: 'destructive' });
    } else {
      if (insertedCount && insertedCount > 0) {
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
        <DocumentItemsCard
          title={t('createStudySessionTitle')}
          plainItems={document?.recognized_text?.items || []}
          document={document}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          handleStartSession={handleStartSession}
          onAddToStudyPlan={handleAddToStudyPlan}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
