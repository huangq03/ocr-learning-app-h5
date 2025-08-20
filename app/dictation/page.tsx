'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import DictationInterface from '@/components/dictation-interface';
import type { User } from '@supabase/supabase-js';

export default function DictationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [textItems, setTextItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchUserAndItems = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        redirect('/auth/login');
        return;
      }
      setUser(user);

      const studySessionString = localStorage.getItem('studySession');
      if (studySessionString) {
        const studySession = JSON.parse(studySessionString);
        if (studySession.type === 'dictation') {
          // The items are strings, we need to convert them to the format expected by DictationInterface
          const formattedItems = studySession.items.map((item: string, index: number) => ({ id: `local-${index}`, content: item }));
          setTextItems(formattedItems);
          localStorage.removeItem('studySession'); // Clear after use
        } else {
          // Fetch all items if the session is not for dictation
          const { data } = await supabase
            .from('text_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          setTextItems(data || []);
        }
      } else {
        // Fetch all items if no session is found
        const { data } = await supabase
          .from('text_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setTextItems(data || []);
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
