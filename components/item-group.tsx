'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import '@/i18n';
import { playAudio } from '@/lib/audio-player';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnrichedTextItem {
  text_item_id: string;
  content: string;
  is_mastered: boolean;
  name?: string;
  american_phonetic_symbol?: string;
  english_phonetic_symbol?: string;
  en_pronunciation?: string;
  us_pronunciation?: string;
  explanation?: string;
}

interface DocumentWithEnrichedItems {
  id: string;
  created_at: string;
  items: EnrichedTextItem[];
}

export default function ItemGroup({ document }: { document: DocumentWithEnrichedItems }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const items = document.items || [];

  const handlePlay = (item: EnrichedTextItem) => {
    playAudio(item);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <CardTitle className="text-lg font-medium">
            <span>{t('documentFrom')} {new Date(document.created_at).toLocaleDateString()}</span>
          </CardTitle>
          <Badge variant="outline" className="mt-1">{items.length} {t('itemsCountLabel')}</Badge>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <TooltipProvider>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.text_item_id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                        <div className="flex-grow">
                          <p className="text-sm font-medium">{item.content}</p>
                          {item.name && (
                            <div className="text-xs text-gray-500 flex items-center space-x-3">
                              {item.american_phonetic_symbol && <span>US: /{item.american_phonetic_symbol}/</span>}
                              {item.english_phonetic_symbol && <span>UK: /{item.english_phonetic_symbol}/</span>}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handlePlay(item); }}>
                          <Volume2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {item.explanation && (
                      <TooltipContent>
                        <p>{item.explanation}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              ))}
            </ul>
          </TooltipProvider>
        </CardContent>
      )}
    </Card>
  );
}