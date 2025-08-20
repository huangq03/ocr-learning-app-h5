'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import StudyInterface from '@/components/study-interface';
import type { User } from '@supabase/supabase-js';

async function getDueItems(user: User) {
    const today = new Date().toISOString().split("T")[0];

    const { data: dueItems, error } = await supabase
        .from("spaced_repetition_schedule")
        .select(`
            *,
            text_items:text_item_id (*)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .lte("next_review_date", today);

    if (error) {
        console.error("Error fetching due items:", error);
        return [];
    }

    return dueItems;
}

export default function StudyPage() {
    const [user, setUser] = useState<User | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
                    const { data } = await supabase
                        .from('spaced_repetition_schedule')
                        .select(`
                            *,
                            text_items:text_item_id (*)
                        `)
                        .eq('user_id', user.id)
                        .in('text_items.content', studySession.items);

                    setItems(data || []);
                    localStorage.removeItem('studySession'); // Clear after use
                } else {
                    const dueItems = await getDueItems(user);
                    setItems(dueItems || []);
                }
            } else {
                const dueItems = await getDueItems(user);
                setItems(dueItems || []);
            }
            setIsLoading(false);
        };

        fetchUserAndItems();
    }, []);

    if (isLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Loading...</h1>
            </div>
        );
    }

    return <StudyInterface initialItems={items} user={user} />;
}
