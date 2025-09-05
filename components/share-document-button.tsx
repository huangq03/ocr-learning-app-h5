
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useTranslation } from 'react-i18next';
import '@/i18n';
import { Share2 } from 'lucide-react';


interface TextItem {
  id: string;
  content: string;
}

interface ShareDocumentButtonProps {
  documentId: string;
}

async function getTextItemsForDocument(documentId: string): Promise<TextItem[]> {
    const response = await fetch(`/api/documents/${documentId}/items`);
    if (!response.ok) {
        throw new Error('Failed to fetch text items');
    }
    return response.json();
}

export function ShareDocumentButton({ documentId }: ShareDocumentButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<TextItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      getTextItemsForDocument(documentId)
        .then(setItems)
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, documentId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleCreateLink = async () => {
    if (!title || selectedItems.length === 0) {
      alert(t('share.errorMissingData'));
      return;
    }

    const response = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, itemIds: selectedItems }),
    });

    if (response.ok) {
      const { id } = await response.json();
      setGeneratedLink(`${window.location.origin}/share/${id}`);
    } else {
      alert(t('share.errorFailedCreate'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" /> {t('share.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('share.modalTitle')}</DialogTitle>
        </DialogHeader>
        {error && (
            <div className="text-red-500 p-4 border border-red-500/50 bg-red-500/10 rounded-md">
                <p><strong>Error:</strong> {error}</p>
            </div>
        )}
        {isLoading ? (
          <p>{t('share.loadingItems')}</p>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            <p>{t('share.noItemsMessage')}</p>
            <p className="text-sm">{t('share.noItemsHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="share-title">{t('share.titleLabel')}</Label>
              <Input id="share-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="select-all" onCheckedChange={handleSelectAll} />
                    <Label htmlFor="select-all">{t('share.selectAllLabel')}</Label>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md">
                {items.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox 
                        id={item.id} 
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => {
                            setSelectedItems(prev => 
                                checked ? [...prev, item.id] : prev.filter(id => id !== item.id)
                            );
                        }}
                    />
                    <Label htmlFor={item.id} className="font-normal">{item.content}</Label>
                    </div>
                ))}
                </div>
            </div>
            <Button onClick={handleCreateLink} disabled={!title || selectedItems.length === 0}>
              {t('share.createLinkButton')}
            </Button>
            {generatedLink && (
              <div className="mt-4">
                <Label>{t('share.linkReadyLabel')}</Label>
                <Input readOnly value={generatedLink} />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
