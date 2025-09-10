'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Edit, X } from 'lucide-react';
import { updateDocumentNameAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditableTitleProps {
  documentId: string;
  initialTitle: string;
}

export function EditableTitle({ documentId, initialTitle }: EditableTitleProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const { toast } = useToast();

  const handleSave = async () => {
    if (title && title !== initialTitle) {
      const result = await updateDocumentNameAction(documentId, title);
      if (result.error) {
        toast({ title: t('editableTitle.error'), description: t('editableTitle.errorDescription'), variant: "destructive" });
      } else {
        toast({ title: t('editableTitle.success'), description: t('editableTitle.successDescription') });
        initialTitle = title;
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(initialTitle);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-2xl font-bold" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" onClick={handleSave}><Check className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent><p>{t('editableTitle.saveAriaLabel')}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={handleCancel}><X className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent><p>{t('editableTitle.cancelAriaLabel')}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold text-gray-800">{title || t('editableTitle.untitled')}</h1>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{t('editableTitle.editAriaLabel')}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
