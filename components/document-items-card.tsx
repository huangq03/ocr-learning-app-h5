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

interface Document {
  id: string;
  user_id: string;
  created_at: string;
  name?: string;
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

interface Item {
  id?: string;
  content?: string;
  name?: string;
}

interface Props {
  title?: string;
  document?: Document;
  handleStartSession: (type: 'recitation' | 'dictation') => void;
  onAddToStudyPlan?: (items: Item[]) => void;
  isLoading?: boolean;
}

function DocumentItemsCard({ title, document, handleStartSession, onAddToStudyPlan, isLoading = false }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [enrichedData, setEnrichedData] = useState<Map<string, WordData>>(new Map());

  const items = (document?.recognized_text?.items || []).sort((a, b) => {
    const cleaned_text = document?.recognized_text?.cleaned_text || '';
    const indexA = cleaned_text.indexOf(a);
    const indexB = cleaned_text.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  useEffect(() => {
    const fetchEnrichedData = async () => {
      if (items.length > 0) {
        const { wordsData, error } = await getWordsDataAction(items);
        if (wordsData) {
          const dataMap = new Map(wordsData.map(word => [word.name, word]));
          setEnrichedData(dataMap);
        }
      }
    };
    fetchEnrichedData();
  }, [document]);

  const handleToggleAll = (checked: boolean) => {
    setSelectedItems(checked ? items : []);
  };

  const handleToggleItem = (item: Item, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, item]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id && i.content !== item.content && i.name !== item.name));
    }
  };

  const handleAddToStudyPlan = async () => {
    if (!onAddToStudyPlan) return;

    if (selectedItems.length === 0) {
      toast({ title: <span className="text-white">{t('selectItemsAlert')}</span>, variant: 'destructive' });
      return;
    }

    onAddToStudyPlan(selectedItems);
  };

  const handlePlay = (item: WordData) => {
    playAudio(item);
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
            {document ? (
              <EditableTitle documentId={document.id} initialTitle={title || `Document from ${new Date(document.created_at).toLocaleDateString()}`} />
            ) : (
              <CardTitle className="text-2xl font-bold text-gray-800">{title}</CardTitle>
            )}
            <p className="text-gray-500">{t('createStudySessionSubtitle')}</p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedItems.length > 0 && selectedItems.length === items.length}
                  onCheckedChange={handleToggleAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">{t('selectAllItems')}</label>
              </div>
              <ScrollArea className="h-64 w-full border-t pt-4">
                <TooltipProvider>
                  <div className="space-y-2">
                    {items.map((item, index) => {
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
              {onAddToStudyPlan && (
                <Button onClick={handleAddToStudyPlan} disabled={isLoading || selectedItems.length === 0} className="sm:col-span-2 bg-green-600 hover:bg-green-700">
                  <BrainCircuit className="w-5 h-5 mr-2" />
                  {isLoading ? t('addingToStudyPlan') : t('addToStudyPlan')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export {
  type Document,
  DocumentItemsCard
}