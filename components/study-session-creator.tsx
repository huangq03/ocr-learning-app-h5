'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Headphones, ArrowLeft, BrainCircuit, Volume2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { useToast } from '@/hooks/use-toast';
import { addToStudyPlanAction } from '@/lib/actions';

interface EnrichedTextItem {
  text_item_id: string;
  content: string;
  // All fields from the 'words' table are available here, e.g.:
  name?: string;
  american_phonetic_symbol?: string;
  english_phonetic_symbol?: string;
  en_pronunciation?: string;
  us_pronunciation?: string;
  explanation?: string;
}

interface StudySessionCreatorProps {
  items: EnrichedTextItem[];
  documentId: string;
}

export default function StudySessionCreator({ items: allItems, documentId }: StudySessionCreatorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleAll = (checked: boolean) => {
    setSelectedItems(checked ? allItems.map(item => item.content) : []);
  };

  const handleToggleItem = (itemContent: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemContent]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i !== itemContent));
    }
  };

  const addToStudyPlan = async (items: string[]) => {
    setIsLoading(true);
    const result = await addToStudyPlanAction(documentId, items);
    setIsLoading(false);
    return result;
  };

  const handleStartSession = async (type: 'recitation' | 'dictation') => {
    if (selectedItems.length === 0) {
      toast({ title: <span className="text-white">{t('selectItemsAlert')}</span>, variant: 'destructive' });
      return;
    }

    const cleaned_text = document.recognized_text?.cleaned_text || '';
    const sortedSelectedItems = [...selectedItems].sort((a, b) => {
        const indexA = cleaned_text.indexOf(a);
        const indexB = cleaned_text.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const { insertedItems, error } = await addToStudyPlan(sortedSelectedItems);

    if (error) {
      toast({
        title: <span className="text-white">{t('errorAddToStudyPlan')}</span>,
        description: <span className="text-white">{error}</span>,
        variant: 'destructive',
      });
      return;
    }

    const studySession = { type, items: insertedItems, documentId: document.id };
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

    const cleaned_text = document.recognized_text?.cleaned_text || '';
    const sortedSelectedItems = [...selectedItems].sort((a, b) => {
        const indexA = cleaned_text.indexOf(a);
        const indexB = cleaned_text.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const { insertedCount, error } = await addToStudyPlan(sortedSelectedItems);
    if (error) {
      console.error('Error adding items to study plan:', error);
      toast({
        title: <span className="text-white">{t('errorAddToStudyPlan')}</span>,
        description: <span className="text-white">{error}</span>,
        variant: 'destructive',
      });
    } else {
      if (insertedCount && insertedCount > 0) {
        toast({ title: t('successAddToStudyPlan'), description: t('successAddToStudyPlanDesc', { count: insertedCount }) });
      } else {
        toast({ title: t('noNewItemsAdded'), description: t('noNewItemsAddedDesc') });
      }
      setSelectedItems([]);
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL;

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
                <TooltipProvider>
                  <div className="space-y-2">
                    {allItems.map((item, index) => (
                      <Tooltip key={item.text_item_id}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100">
                            <Checkbox
                              id={`item-${index}`}
                              checked={selectedItems.includes(item.content)}
                              onCheckedChange={(checked) => handleToggleItem(item.content, !!checked)}
                            />
                            <div className="flex-grow">
                              <label htmlFor={`item-${index}`} className="text-sm font-medium">{item.content}</label>
                              {item.name && (
                                <div className="text-xs text-gray-500 flex items-center space-x-2">
                                  {item.american_phonetic_symbol && <span>US: /{item.american_phonetic_symbol}/</span>}
                                  {item.english_phonetic_symbol && <span>UK: /{item.english_phonetic_symbol}/</span>}
                                </div>
                              )}
                            </div>
                            {item.us_pronunciation && (
                              <Button variant="ghost" size="icon" onClick={() => new Audio(baseUrl + item.us_pronunciation).play()}>
                                <Volume2 className="h-4 w-4" />
                                <span className="sr-only">Play US pronunciation</span>
                              </Button>
                            )}
                            {item.en_pronunciation && (
                              <Button variant="ghost" size="icon" onClick={() => new Audio(baseUrl + item.en_pronunciation).play()}>
                                <Volume2 className="h-4 w-4" />
                                <span className="sr-only">Play UK pronunciation</span>
                              </Button>
                            )}
                          </div>
                        </TooltipTrigger>
                        {item.explanation && (
                          <TooltipContent>
                            <p>{item.explanation}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
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
