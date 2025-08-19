'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

interface Document {
  id: string;
  created_at: string;
  recognized_text: {
    items: string[];
    cleaned_text: string;
  };
}

export default function ItemGroup({ document }: { document: Document }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const items = document.recognized_text?.items || [];
  const cleaned_text = document.recognized_text?.cleaned_text || '';

  const sortedItems = [...items].sort((a, b) => {
    const indexA = cleaned_text.indexOf(a);
    const indexB = cleaned_text.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handlePlay = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (nowPlaying === text) {
        setNowPlaying(null);
        setHighlightedWordIndex(-1);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    let wordIndex = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightedWordIndex(wordIndex++);
      }
    };

    utterance.onstart = () => {
      setNowPlaying(text);
      setHighlightedWordIndex(-1);
      wordIndex = 0;
    };
    utterance.onend = () => {
      setNowPlaying(null);
      setHighlightedWordIndex(-1);
    };
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <CardTitle className="text-lg font-medium">
            <span>Document from {new Date(document.created_at).toLocaleDateString()}</span>
          </CardTitle>
          <Badge variant="outline" className="mt-1">{items.length} items</Badge>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            {sortedItems.map((item, index) => (
              <li key={index} className="p-2 bg-gray-100 rounded-md text-gray-800 flex items-center justify-between">
                <span>
                  {item.split(/(\s+)/).map((word, wordIndex) => (
                    <span key={wordIndex} className={nowPlaying === item && highlightedWordIndex === Math.floor(wordIndex / 2) ? 'bg-yellow-200' : ''}>
                      {word}
                    </span>
                  ))}
                </span>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handlePlay(item); }}>
                  <Volume2 className={`w-4 h-4 ${nowPlaying === item ? 'text-purple-600' : ''}`} />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
