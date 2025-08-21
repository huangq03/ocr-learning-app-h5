'use client'

import { useState, useCallback, useEffect, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { useTranslation } from 'react-i18next'
import '@/i18n'
import { saveDictationResult } from "@/lib/actions"
import { calculateAccuracy } from "@/lib/dictation-utils"
import { StartScreen } from "@/components/dictation-start-screen"
import { DictationItemView } from "@/components/dictation-item-view"
import { SummaryScreen } from "@/components/dictation-summary-screen"

interface DictationInterfaceProps {
  user: User
  textItems: any[]
}

type DictationMode = 'typing' | 'paper';

interface SessionResult {
  text_item_id: string
  original_text: string
  user_input: string
  attempts: number
  is_correct_on_first_try: boolean
  character_accuracy: number
  completion_time_seconds: number
}

export default function DictationInterface({ user, textItems }: DictationInterfaceProps) {
  const { t, i18n } = useTranslation();
  const [selections, setSelections] = useState(textItems)
  const [currentSelectionIndex, setCurrentSelectionIndex] = useState(-1)
  const [userInput, setUserInput] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [mode, setMode] = useState<DictationMode>('paper') // Default to paper mode
  const [paperInputChecked, setPaperInputChecked] = useState(false) // For paper mode verification
  
  // Auto mode states
  const [autoMode, setAutoMode] = useState(true) // Default to auto mode enabled
  const [timeoutValue, setTimeoutValue] = useState(5) // Default 5 seconds
  const [timeLeft, setTimeLeft] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null) // Countdown before playing audio
  const [autoSessionStarted, setAutoSessionStarted] = useState(false) // Track if auto session has started
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const [isSessionStarted, setIsSessionStarted] = useState(false)

  useEffect(() => {
    setStartTime(Date.now())
    // When changing items in auto mode (after the first one), start the item countdown
    if (autoMode && autoSessionStarted && currentSelectionIndex > -1) {
      autoPlayWithCountdown()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSelectionIndex, autoMode, autoSessionStarted])

  const handleCheck = useCallback(() => {
    const currentSelection = selections[currentSelectionIndex]
    if (!currentSelection) return

    if (mode === 'typing') {
      setAttempts(prev => prev + 1)
      if (userInput.trim().toLowerCase() === currentSelection.content.toLowerCase()) {
        setIsCorrect(true)
      } else {
        setIsCorrect(false)
      }
    } else {
      // In paper mode, we just mark it as checked
      setPaperInputChecked(true)
      setIsCorrect(true)
    }
  }, [userInput, selections, currentSelectionIndex, mode])

  const handleNext = () => {
    const newIndex = currentSelectionIndex + 1;
    if (newIndex < selections.length) {
      setCurrentSelectionIndex(newIndex);
      setUserInput('');
      setIsCorrect(null);
      setAttempts(0);
      setPaperInputChecked(false);
      setStartTime(Date.now());
    } else {
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    const newIndex = currentSelectionIndex - 1;
    if (newIndex >= 0) {
      setCurrentSelectionIndex(newIndex);
      setUserInput('');
      setIsCorrect(null);
      setAttempts(0);
      setPaperInputChecked(false);
      setStartTime(Date.now());
    }
  };

  const handleAnswer = async () => {
    // Clear any existing timer
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
    
    const endTime = Date.now()
    const completionTime = Math.round((endTime - startTime) / 1000)
    const currentSelection = selections[currentSelectionIndex]

    let result: SessionResult;

    if (mode === 'typing') {
      const isCorrectOnFirstTry = attempts === 1 && isCorrect
      const characterAccuracy = calculateAccuracy(currentSelection.content, userInput.trim())

      result = {
        text_item_id: currentSelection.id,
        original_text: currentSelection.content,
        user_input: userInput.trim(),
        attempts: attempts,
        is_correct_on_first_try: isCorrectOnFirstTry,
        character_accuracy: characterAccuracy,
        completion_time_seconds: completionTime,
      }
    } else {
      // For paper mode, we don't have actual user input to compare
      result = {
        text_item_id: currentSelection.id,
        original_text: currentSelection.content,
        user_input: "[Written on paper]",
        attempts: 1,
        is_correct_on_first_try: true, // Assume correct for paper mode
        character_accuracy: 100, // Assume 100% for paper mode
        completion_time_seconds: completionTime,
      }
    }

    setSessionResults([...sessionResults, result])

    await saveDictationResult({
      user_id: user.id,
      text_item_id: result.text_item_id,
      target_text: result.original_text,
      user_input: result.user_input,
      accuracy_score: result.character_accuracy,
      mistakes_count: mode === 'typing' ? attempts - 1 : 0,
      completion_time_seconds: completionTime,
      completed_at: new Date().toISOString(),
    })
  }

  const handleRestart = () => {
    // Clear any existing timers
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null
    }
    
    setCurrentSelectionIndex(-1)
    setUserInput("")
    setIsCorrect(null)
    setAttempts(0)
    setSessionResults([])
    setShowSummary(false)
    setPaperInputChecked(false)
    setAutoSessionStarted(false)
    setCountdown(null)
    setTimeLeft(0)
    setIsSessionStarted(false)
  }

  const handleCheckAnswerAndNext = async () => {
    const currentSelection = selections[currentSelectionIndex];
    if (!currentSelection) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    let isCorrectResult: boolean;
    if (mode === 'typing') {
      isCorrectResult = userInput.trim().toLowerCase() === currentSelection.content.toLowerCase();
    } else {
      isCorrectResult = true;
    }

    const endTime = Date.now();
    const completionTime = Math.round((endTime - startTime) / 1000);

    let result: SessionResult;

    if (mode === 'typing') {
      const isCorrectOnFirstTry = newAttempts === 1 && isCorrectResult;
      const characterAccuracy = calculateAccuracy(currentSelection.content, userInput.trim());

      result = {
        text_item_id: currentSelection.id,
        original_text: currentSelection.content,
        user_input: userInput.trim(),
        attempts: newAttempts,
        is_correct_on_first_try: isCorrectOnFirstTry,
        character_accuracy: characterAccuracy,
        completion_time_seconds: completionTime,
      };
    } else {
      result = {
        text_item_id: currentSelection.id,
        original_text: currentSelection.content,
        user_input: "[Written on paper]",
        attempts: 1,
        is_correct_on_first_try: true,
        character_accuracy: 100,
        completion_time_seconds: completionTime,
      };
    }

    setSessionResults(prev => [...prev, result]);

    await saveDictationResult({
      user_id: user.id,
      text_item_id: result.text_item_id,
      target_text: result.original_text,
      user_input: result.user_input,
      accuracy_score: result.character_accuracy,
      mistakes_count: mode === 'typing' ? newAttempts - 1 : 0,
      completion_time_seconds: completionTime,
      completed_at: new Date().toISOString(),
    });

    handleNext()
  }

  const playBeep = () => {
    if (typeof window === 'undefined') return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  const autoPlayWithCountdown = () => {
    if (!autoMode) return;
    
    playBeep();

    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
    }
    
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
    }
    
    setCountdown(3)
    countdownRef.current = setTimeout(() => {
      setCountdown(2)
      countdownRef.current = setTimeout(() => {
        setCountdown(1)
        countdownRef.current = setTimeout(() => {
          setCountdown(null)
          handleListen()
        }, 1000)
      }, 1000)
    }, 1000)
  }

  const handleListen = () => {
    const currentSelection = selections[currentSelectionIndex]
    if (!currentSelection || typeof window === 'undefined') return
    const utterance = new SpeechSynthesisUtterance(currentSelection.content)
    utterance.lang = 'en-US'
    
    utterance.onend = () => {
      if (autoMode && autoSessionStarted) {
        setTimeLeft(timeoutValue)
      }
    }
    
    window.speechSynthesis.speak(utterance)
  }

  const startAutoSession = () => {
    setAutoSessionStarted(true)
    handleNext()
  }

  const resetAutoSession = () => {
    setAutoSessionStarted(false)
    setCountdown(null)
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  useEffect(() => {
    if (!autoMode) {
      resetAutoSession();
    }
  }, [autoMode]);

  useEffect(() => {
    if (!autoMode || showSummary || !autoSessionStarted || countdown !== null) return

    if (timeLeft > 0) {
      autoTimerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (autoTimerRef.current && timeLeft === 0) {
      handleAnswer().then(() => handleNext())
    }

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current)
      }
    }
  }, [autoMode, timeLeft, showSummary, autoSessionStarted, countdown])

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current)
      }
    }
  }, [])

  const handleStartSession = () => {
    if (autoMode) {
      const notificationMessage = t('autoModeStartNotification', { timeoutValue });
      const utterance = new SpeechSynthesisUtterance(notificationMessage);
      let lang = i18n.language;
      if (lang === 'zh') {
        utterance.lang = 'zh-CN';
      } else {
        utterance.lang = 'en-US';
      }
      utterance.onend = () => {
        setIsSessionStarted(true);
        startAutoSession();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSessionStarted(true);
      setCurrentSelectionIndex(0);
    }
  }

  // Render different screens based on state
  if (!isSessionStarted) {
    return (
      <StartScreen
        autoMode={autoMode}
        setAutoMode={setAutoMode}
        timeoutValue={timeoutValue}
        setTimeoutValue={setTimeoutValue}
        mode={mode}
        setMode={setMode}
        onStart={handleStartSession}
      />
    )
  }

  if (selections.length === 0) {
    return <p className="text-center p-8">No text items available for dictation.</p>
  }

  if (showSummary) {
    return <SummaryScreen sessionResults={sessionResults} onRestart={handleRestart} />
  }

  const currentSelection = selections[currentSelectionIndex]
  const isLastItem = currentSelectionIndex === selections.length - 1
  const itemCounter = t('itemCounter', { current: currentSelectionIndex + 1, total: selections.length })

  return (
    <DictationItemView
      currentSelection={currentSelection}
      userInput={userInput}
      setUserInput={setUserInput}
      isCorrect={isCorrect}
      paperInputChecked={paperInputChecked}
      mode={mode}
      autoMode={autoMode}
      timeLeft={timeLeft}
      countdown={countdown}
      onListen={handleListen}
      onPrevious={handlePrevious}
      onNext={handleCheckAnswerAndNext}
      onCheck={handleCheck}
      itemCounter={itemCounter}
      isLastItem={isLastItem}
    />
  )
}
