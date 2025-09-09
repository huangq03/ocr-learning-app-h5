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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface WordData {
  name: string;
  american_phonetic_symbol?: string;
  english_phonetic_symbol?: string;
  en_pronunciation?: string;
  us_pronunciation?: string;
  explanation?: string;
}

export default function StudySessionCreator({ document }: { document: Document }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState<Map<string, WordData>>(new Map());
  const baseUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL || '';

  const allItems = (document.recognized_text?.items || []).sort((a, b) => {
    const cleaned_text = document.recognized_text?.cleaned_text || '';
    const indexA = cleaned_text.indexOf(a);
    const indexB = cleaned_text.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  useEffect(() => {
    const fetchEnrichedData = async () => {
      if (allItems.length > 0) {
        const { wordsData, error } = await getWordsDataAction(allItems);
        if (wordsData) {
          const dataMap = new Map(wordsData.map(word => [word.name, word]));
          setEnrichedData(dataMap);
        }
      }
    };
    fetchEnrichedData();
  }, [document]);

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

  const handlePlay = (item: WordData) => {
    if (item.us_pronunciation) {
        new Audio(baseUrl + item.us_pronunciation).play();
    } else if (item.en_pronunciation) {
        new Audio(baseUrl + item.en_pronunciation).play();
    } else if (item.name) {
        speakText(item.name, 'en');
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
                <TooltipProvider>
                  <div className="space-y-2">
                    {allItems.map((item, index) => {
                      const wordData = enrichedData.get(item);
                      return (
                        <div key={index} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100">
                          <Checkbox
                            id={`item-${index}`}
                            checked={selectedItems.includes(item)}
                            onCheckedChange={(checked) => handleToggleItem(item, !!checked)}
                          />
                          <div className="flex-grow">
                            <label htmlFor={`item-${index}`} className="text-sm font-medium">{item}</label>
                            {wordData && (
                              <div className="text-xs text-gray-500 flex items-center space-x-2">
                                {wordData.american_phonetic_symbol && <span>US: /{wordData.american_phonetic_symbol}/</span>}
                                {wordData.english_phonetic_symbol && <span>UK: /{wordData.english_phonetic_symbol}/</span>}
                              </div>
                            )}
                          </div>
                          {wordData && (wordData.us_pronunciation || wordData.en_pronunciation) && (
                            <Button variant="ghost" size="icon" onClick={() => handlePlay(wordData)}>
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
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
              <Button onClick={handleAddToStudyPlan} disabled={isLoading || selectedItems.length === 0} className="sm:col-span-2 bg-green-600 hover:bg-green-700">
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
