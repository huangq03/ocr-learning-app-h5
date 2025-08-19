"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { BarChart, Smile, Meh, Frown, Angry, Volume2 } from 'lucide-react';

// SM-2 Algorithm Implementation
const calculateSm2 = (item: any, quality: number) => {
    let { repetition_number, ease_factor, interval_days } = item;

    if (quality < 3) {
        repetition_number = 0;
        interval_days = 1;
    } else {
        if (repetition_number === 0) {
            interval_days = 1;
        } else if (repetition_number === 1) {
            interval_days = 6;
        } else {
            interval_days = Math.round(interval_days * ease_factor);
        }
        repetition_number += 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) {
        ease_factor = 1.3;
    }

    const next_review_date = new Date();
    next_review_date.setDate(next_review_date.getDate() + interval_days);

    return {
        repetition_number,
        ease_factor,
        interval_days,
        next_review_date: next_review_date.toISOString().split('T')[0],
        last_reviewed_at: new Date().toISOString(),
        quality_score: quality,
    };
};

interface StudyInterfaceProps {
    initialItems: any[];
    user: User;
}

interface SessionStats {
    again: number;
    hard: number;
    good: number;
    easy: number;
}

export default function StudyInterface({ initialItems, user }: StudyInterfaceProps) {
    const router = useRouter();
    const [items, setItems] = useState(initialItems);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionStats, setSessionStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 });
    const [nowPlaying, setNowPlaying] = useState<string | null>(null);

    const handlePlay = (text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (nowPlaying === text) {
                setNowPlaying(null);
                return;
            }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.onstart = () => setNowPlaying(text);
        utterance.onend = () => setNowPlaying(null);
        window.speechSynthesis.speak(utterance);
    };

    const handleRating = async (quality: number) => {
        const currentItem = items[currentIndex];
        const updatedSchedule = calculateSm2(currentItem, quality);

        // Update stats
        if (quality === 0) setSessionStats(prev => ({ ...prev, again: prev.again + 1 }));
        else if (quality === 3) setSessionStats(prev => ({ ...prev, hard: prev.hard + 1 }));
        else if (quality === 4) setSessionStats(prev => ({ ...prev, good: prev.good + 1 }));
        else if (quality === 5) setSessionStats(prev => ({ ...prev, easy: prev.easy + 1 }));

        const { error } = await supabase
            .from('spaced_repetition_schedule')
            .update(updatedSchedule)
            .eq('id', currentItem.id);

        if (error) {
            console.error('Error updating schedule:', error);
        } else {
            if (currentIndex < items.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                setShowSummary(true);
            }
        }
    };

    if (items.length === 0) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold mb-4">No items due for review today!</h2>
                <p className="text-gray-600 mb-6">Great job staying on top of your studies.</p>
                <Button onClick={() => router.push('/')}>Back to Dashboard</Button>
            </div>
        );
    }

    if (showSummary) {
        return (
            <div className="p-4 max-w-2xl mx-auto">
                <Card className="p-6 text-center">
                    <h2 className="text-3xl font-bold mb-4 text-purple-700">Session Complete!</h2>
                    <p className="text-gray-600 mb-6">You reviewed {items.length} items in this session.</p>
                    <div className="flex justify-around my-6">
                        <div className="flex flex-col items-center"><Angry className="w-8 h-8 text-red-500" /><span>{sessionStats.again} Again</span></div>
                        <div className="flex flex-col items-center"><Frown className="w-8 h-8 text-orange-500" /><span>{sessionStats.hard} Hard</span></div>
                        <div className="flex flex-col items-center"><Meh className="w-8 h-8 text-yellow-500" /><span>{sessionStats.good} Good</span></div>
                        <div className="flex flex-col items-center"><Smile className="w-8 h-8 text-green-500" /><span>{sessionStats.easy} Easy</span></div>
                    </div>
                    <Button onClick={() => router.push('/')}>Back to Dashboard</Button>
                </Card>
            </div>
        );
    }

    const currentItem = items[currentIndex];
    const progress = ((currentIndex + 1) / items.length) * 100;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Study Session</CardTitle>
                    <Progress value={progress} className="mt-2" />
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-center">
                    <div>
                        <div className="flex items-center justify-center gap-4">
                            <p className="text-2xl font-bold mb-2">{currentItem.text_items.content}</p>
                            <Button variant="ghost" size="icon" onClick={() => handlePlay(currentItem.text_items.content)}>
                                <Volume2 className={`w-6 h-6 ${nowPlaying === currentItem.text_items.content ? 'text-purple-600' : ''}`} />
                            </Button>
                        </div>
                        <p className="text-lg text-gray-600">{currentItem.text_items.context}</p>
                        <p className="text-md text-gray-500 italic">{currentItem.text_items.user_definition}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center">
                    <div className="flex justify-around w-full">
                        <Button variant="destructive" onClick={() => handleRating(0)}>Again</Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleRating(3)}>Hard</Button>
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleRating(4)}>Good</Button>
                        <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleRating(5)}>Easy</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
