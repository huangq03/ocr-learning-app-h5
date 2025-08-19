'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const items = document.recognized_text?.items || [];
  const cleaned_text = document.recognized_text?.cleaned_text || '';

  const sortedItems = [...items].sort((a, b) => {
    const indexA = cleaned_text.indexOf(a);
    const indexB = cleaned_text.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

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
              <li key={index} className="p-2 bg-gray-100 rounded-md text-gray-800">{item}</li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
