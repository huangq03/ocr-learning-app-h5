'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import StudyInterface from '@/components/study-interface';
import type { User } from '@supabase/supabase-js';
import { getStudyPageData } from '@/lib/actions';
import { supabase } from '@/lib/supabase/client';

export default function StudyPage() {
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<any[]>([]);
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
                if (studySession.type === 'recitation') {
                    const result = await getStudyPageData(user.id, studySession.items);
                    if (result.error) {
                        console.error('Error fetching study session items:', result.error);
                    } else {
                        setItems(result.items || []);
                    }
                    localStorage.removeItem('studySession'); // Clear after use
                } else {
                    const result = await getStudyPageData(user.id);
                    if (result.error) {
                        console.error('Error fetching due items:', result.error);
                    } else {
                        setItems(result.items || []);
                    }
                }
            } else {
                const result = await getStudyPageData(user.id);
                if (result.error) {
                    console.error('Error fetching due items:', result.error);
                } else {
                    setItems(result.items || []);
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

    return <StudyInterface initialItems={items} user={user} />;
}