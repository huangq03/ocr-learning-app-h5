'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Smile, Meh, Frown, Angry, Volume2 } from 'lucide-react';
import { updateStudyScheduleAction } from '@/lib/actions';

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
    const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationClass, setAnimationClass] = useState('transform translate-x-full');

    useEffect(() => {
        // Slide in the first card from the right
        const timer = setTimeout(() => {
            setAnimationClass('transform-none');
        }, 100); // Small delay to ensure the transition is applied
        return () => clearTimeout(timer);
    }, []);

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

    const handleRating = async (quality: number) => {
        if (isAnimating) return;
        setIsAnimating(true);

        const currentItem = items[currentIndex];
        const updatedSchedule = calculateSm2(currentItem, quality);

        // Update stats
        if (quality === 0) setSessionStats(prev => ({ ...prev, again: prev.again + 1 }));
        else if (quality === 3) setSessionStats(prev => ({ ...prev, hard: prev.hard + 1 }));
        else if (quality === 4) setSessionStats(prev => ({ ...prev, good: prev.good + 1 }));
        else if (quality === 5) setSessionStats(prev => ({ ...prev, easy: prev.easy + 1 }));

        await updateStudyScheduleAction(currentItem.id, updatedSchedule);

        // Slide out to the left
        setAnimationClass('transform -translate-x-full');

        setTimeout(() => {
            if (currentIndex < items.length - 1) {
                // Instantly move the new card to the right, off-screen
                setAnimationClass('transform translate-x-full transition-none');
                setCurrentIndex(currentIndex + 1);

                // After a short delay to allow re-render, slide the new card in
                setTimeout(() => {
                    setAnimationClass('transform-none');
                    setIsAnimating(false);
                }, 50);
            } else {
                setShowSummary(true);
            }
        }, 300); // This duration should match the CSS transition duration
    };

    if (items.length === 0) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold mb-4">No items due for review today!</h2>
                <p className="text-gray-600 mb-6">Great job staying on top of your studies.</p>
                <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
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
                    <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                </Card>
            </div>
        );
    }

    const currentItem = items[currentIndex];
    const progress = ((currentIndex + 1) / items.length) * 100;

    return (
        <div className="p-4 max-w-2xl mx-auto overflow-hidden">
            <Card className={`w-full transition-transform duration-300 ease-in-out ${animationClass}`}>
                <CardHeader>
                    <CardTitle>Study Session</CardTitle>
                    <Progress value={progress} className="mt-2" />
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-center">
                    <div>
                        <div className="flex items-center justify-center gap-4">
                            <p className="text-2xl font-bold mb-2">
                                {currentItem.content.split(/(\s+)/).map((word, wordIndex) => (
                                    <span key={wordIndex} className={nowPlaying === currentItem.content && highlightedWordIndex === Math.floor(wordIndex / 2) ? 'bg-yellow-200' : ''}>
                                        {word}
                                    </span>
                                ))}
                            </p>
                            <Button variant="ghost" size="icon" onClick={() => handlePlay(currentItem.content)}>
                                <Volume2 className={`w-6 h-6 ${nowPlaying === currentItem.content ? 'text-purple-600' : ''}`} />
                            </Button>
                        </div>
                        <p className="text-lg text-gray-600">{currentItem.context}</p>
                        <p className="text-md text-gray-500 italic">{currentItem.user_definition}</p>
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
