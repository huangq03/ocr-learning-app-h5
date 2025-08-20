'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import DictationInterface from '@/components/dictation-interface';
import type { User } from '@supabase/supabase-js';
import { getDictationPageData } from '@/lib/actions';

export default function DictationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [textItems, setTextItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchUserAndItems = async () => {
      const studySessionString = localStorage.getItem('studySession');
      if (studySessionString) {
        const studySession = JSON.parse(studySessionString);
        if (studySession.type === 'dictation') {
          // The items are strings, we need to convert them to the format expected by DictationInterface
          const formattedItems = studySession.items.map((item: string, index: number) => ({ id: `local-${index}`, content: item }));
          const result = await getDictationPageData();
          if (result.error) {
            console.error('Error fetching user:', result.error);
            redirect('/auth/login');
          } else {
            setUser(result.user);
            setTextItems(formattedItems);
          }
          localStorage.removeItem('studySession'); // Clear after use
        } else {
          const result = await getDictationPageData();
          if (result.error) {
            console.error('Error fetching text items:', result.error);
            redirect('/auth/login');
          } else {
            setUser(result.user);
            setTextItems(result.items || []);
          }
        }
      } else {
        const result = await getDictationPageData();
        if (result.error) {
          console.error('Error fetching text items:', result.error);
          redirect('/auth/login');
        } else {
          setUser(result.user);
          setTextItems(result.items || []);
        }
      }
      setIsLoading(false);
    };

    fetchUserAndItems();
  }, []);

  if (!isMounted || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <DictationInterface user={user} textItems={textItems} />
    </div>
  );
}
