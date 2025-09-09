'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Smile, Meh, Frown, Angry, Volume2, ArrowLeft } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateStudyScheduleAction, saveExerciseResult } from '@/lib/actions';
import { useTranslation } from 'react-i18next';
import { speakText } from '@/lib/speech';


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
    user?: User;
    shareId?: string;
}

interface SessionStats {
    again: number;
    hard: number;
    good: number;
    easy: number;
}

export default function StudyInterface({ initialItems, user, shareId }: StudyInterfaceProps) {
    const { t, i18n } = useTranslation();
    const baseUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL || '';

    const router = useRouter();
    const [items, setItems] = useState(initialItems);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionStats, setSessionStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 });
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationClass, setAnimationClass] = useState('transform translate-x-full');

    useEffect(() => {
        // Slide in the first card from the right
        const timer = setTimeout(() => {
            setAnimationClass('transform-none');
        }, 100); // Small delay to ensure the transition is applied
        return () => clearTimeout(timer);
    }, []);

    const handlePlay = (item: any) => {
        if (item.us_pronunciation) {
            new Audio(baseUrl + item.us_pronunciation).play();
        } else if (item.en_pronunciation) {
            new Audio(baseUrl + item.en_pronunciation).play();
        } else {
            speakText(item.content, 'en');
        }
    };

    const handleRating = async (quality: number) => {
        if (isAnimating) return;
        setIsAnimating(true);

        const currentItem = items[currentIndex];

        // Update stats
        if (quality === 0) setSessionStats(prev => ({ ...prev, again: prev.again + 1 }));
        else if (quality === 3) setSessionStats(prev => ({ ...prev, hard: prev.hard + 1 }));
        else if (quality === 4) setSessionStats(prev => ({ ...prev, good: prev.good + 1 }));
        else if (quality === 5) setSessionStats(prev => ({ ...prev, easy: prev.easy + 1 }));

        // --- Conditional Logic for Saving/Tracking ---
        if (user) {
            // For logged-in users, calculate and save the full result
            const updatedSchedule = calculateSm2(currentItem, quality);
            const qualityToAccuracyMap: { [key: number]: number } = {
                0: 0,   // Again
                3: 50,  // Hard
                4: 80,  // Good
                5: 100, // Easy
            };

            await saveExerciseResult({
                user_id: user.id,
                text_item_id: currentItem.id,
                target_text: currentItem.content,
                user_input: "[recited]",
                accuracy_score: qualityToAccuracyMap[quality],
                mistakes_count: 0,
                completion_time_seconds: 0, // Not tracked in this interface
                details: { self_assessed_quality: quality },
                completed_at: new Date().toISOString(),
            }, 'recitation');
            await updateStudyScheduleAction(currentItem.id, updatedSchedule);
        } else if (shareId) {
            // For anonymous users, just track the engagement
            fetch(`/api/shares/${shareId}/complete-exercise`, { method: 'POST' });
        }
        // --- End of Conditional Logic ---

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
                <h2 className="text-2xl font-bold mb-4">{t('study.noItemsDue')}</h2>
                <p className="text-gray-600 mb-6">{t('study.greatJob')}</p>
                <Button onClick={() => router.push('/dashboard')}>{t('study.backToDashboard')}</Button>
            </div>
        );
    }

    if (showSummary) {
        return (
            <div className="p-4 max-w-2xl mx-auto">
                <Card className="p-6 text-center">
                    <h2 className="text-3xl font-bold mb-4 text-purple-700">{t('study.sessionComplete')}</h2>
                    <p className="text-gray-600 mb-6">{t('study.reviewedItems', { count: items.length })}</p>
                    <div className="flex justify-around my-6">
                        <div className="flex flex-col items-center"><Angry className="w-8 h-8 text-red-500" /><span>{sessionStats.again} {t('study.summaryAgain')}</span></div>
                        <div className="flex flex-col items-center"><Frown className="w-8 h-8 text-orange-500" /><span>{sessionStats.hard} {t('study.summaryHard')}</span></div>
                        <div className="flex flex-col items-center"><Meh className="w-8 h-8 text-yellow-500" /><span>{sessionStats.good} {t('study.summaryGood')}</span></div>
                        <div className="flex flex-col items-center"><Smile className="w-8 h-8 text-green-500" /><span>{sessionStats.easy} {t('study.summaryEasy')}</span></div>
                    </div>
                    {user ? (
                        <Button onClick={() => router.push('/dashboard')}>{t('study.backToDashboard')}</Button>
                    ) : (
                        <div className="text-center">
                            <p className="mb-4">{t('study.signUpPrompt')}</p>
                            <Button onClick={() => router.push('/auth/sign-up')}>{t('signUp.signUpButton')}</Button>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    const currentItem = items[currentIndex];
    const progress = ((currentIndex + 1) / items.length) * 100;

    return (
      <TooltipProvider>
        <div className="p-4 max-w-2xl mx-auto overflow-hidden">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backButton')}
            </Button>
            <Card className={`w-full transition-transform duration-300 ease-in-out ${animationClass}`}>
                <CardHeader>
                    <CardTitle>{t('study.sessionTitle')}</CardTitle>
                    <Progress value={progress} className="mt-2" />
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-center">
                    <div>
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <p className="text-3xl font-bold">
                                {currentItem.content}
                            </p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handlePlay(currentItem)}>
                                        <Volume2 className='w-6 h-6' />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Play TTS Audio</p></TooltipContent>
                            </Tooltip>
                        </div>

                        {currentItem.word_name && (
                            <div className="text-md text-gray-500 flex items-center justify-center space-x-4 mb-4">
                                {currentItem.american_phonetic_symbol && <span>US: /{currentItem.american_phonetic_symbol}/</span>}
                                {currentItem.english_phonetic_symbol && <span>UK: /{currentItem.english_phonetic_symbol}/</span>}
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 mb-4">
                            {currentItem.us_pronunciation && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => new Audio(baseUrl + currentItem.us_pronunciation).play()}>
                                            <span className="text-xs mr-1">US</span> <Volume2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Play US Pronunciation</p></TooltipContent>
                                </Tooltip>
                            )}
                            {currentItem.en_pronunciation && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => new Audio(baseUrl + currentItem.en_pronunciation).play()}>
                                            <span className="text-xs mr-1">UK</span> <Volume2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Play UK Pronunciation</p></TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        <p className="text-lg text-gray-600">{currentItem.context}</p>
                        <p className="text-md text-gray-500 italic">{currentItem.user_definition}</p>

                        {currentItem.explanation && (
                            <div className="mt-4 pt-4 border-t text-left">
                                <ul className="space-y-2">
                                    {JSON.parse(currentItem.explanation).map((exp, index) => (
                                        <li key={index} className="text-sm">
                                            <span className="font-semibold text-purple-700 mr-2">{exp.pro}</span>
                                            <span>{exp.content}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center">
                    <div className="flex justify-around w-full">
                        <Button variant="destructive" onClick={() => handleRating(0)}>{t('study.again')}</Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleRating(3)}>{t('study.hard')}</Button>
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleRating(4)}>{t('study.good')}</Button>
                        <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleRating(5)}>{t('study.easy')}</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
      </TooltipProvider>
    );
}
