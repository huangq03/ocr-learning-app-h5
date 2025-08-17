'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Headphones, ArrowLeft } from 'lucide-react';

// Define the type for our document data
interface Document {
  id: string;
  user_id: string;
  created_at: string;
  file_path: string;
  recognized_text: {
    items: string[];
    cleaned_text: string;
  };
}

export default function StudySessionCreator({ document }: { document: Document }) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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
      alert('Please select at least one item to study.');
      return;
    }
    const studySession = { type, items: selectedItems, documentId: document.id };
    localStorage.setItem('studySession', JSON.stringify(studySession));
    router.push('/study');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Create Study Session</CardTitle>
            <p className="text-gray-500">Select the items you want to practice from your document.</p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedItems.length > 0 && selectedItems.length === allItems.length}
                  onCheckedChange={handleToggleAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">Select All Items</label>
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
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button onClick={() => handleStartSession('recitation')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <BookOpen className="w-5 h-5 mr-2" />
                Start Recitation
              </Button>
              <Button onClick={() => handleStartSession('dictation')} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Headphones className="w-5 h-5 mr-2" />
                Start Dictation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
