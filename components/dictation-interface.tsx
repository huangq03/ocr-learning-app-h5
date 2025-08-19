"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DictationModeSettings } from "@/components/dictation-mode-settings"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { BarChart, CheckCircle, XCircle, Volume2, HelpCircle, Timer } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from 'react-i18next'
import '@/i18n'

// Helper function to calculate Levenshtein distance
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const matrix = Array.from(Array(a.length + 1), () => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) { matrix[i][0] = i }
  for (let j = 0; j <= b.length; j++) { matrix[0][j] = j }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

const calculateAccuracy = (original: string, typed: string): number => {
  const distance = levenshteinDistance(original.toLowerCase(), typed.toLowerCase())
  const length = Math.max(original.length, typed.length)
  if (length === 0) return 100
  const accuracy = ((length - distance) / length) * 100
  return Math.max(0, accuracy)
}

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
  const { t } = useTranslation();
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
    if (currentSelectionIndex < selections.length - 1) {
      setCurrentSelectionIndex(currentSelectionIndex + 1)
      setUserInput("")
      setIsCorrect(null)
      setAttempts(0)
      setPaperInputChecked(false) // Reset paper mode verification
      setStartTime(Date.now())
    } else {
      setShowSummary(true)
    }
  }

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

    await supabase.from("dictation_exercises").insert({
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

    await supabase.from("dictation_exercises").insert({
      user_id: user.id,
      text_item_id: result.text_item_id,
      target_text: result.original_text,
      user_input: result.user_input,
      accuracy_score: result.character_accuracy,
      mistakes_count: mode === 'typing' ? newAttempts - 1 : 0,
      completion_time_seconds: completionTime,
      completed_at: new Date().toISOString(),
    });

    handleNext();
  }

  const autoPlayWithCountdown = () => {
    if (!autoMode) return;
    
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
      handleAnswer()
      handleNext()
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
    setIsSessionStarted(true);
    if (autoMode) {
        startAutoSession();
    } else {
        handleNext();
    }
  }

  if (!isSessionStarted) {
    return (
      <div className="p-4 max-w-2xl mx-auto relative">
        <Card className="p-6 relative flex flex-col items-center justify-center min-h-[500px]">
            <div className="absolute top-4 right-4">
                <DictationModeSettings 
                    autoMode={autoMode}
                    setAutoMode={setAutoMode}
                    timeoutValue={timeoutValue}
                    setTimeoutValue={setTimeoutValue}
                    timeLeft={0}
                    mode={mode}
                    setMode={setMode}
                />
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('dictationReadyTitle', 'Ready for Dictation?')}</h2>
            <p className="text-gray-600 mb-8">{t('dictationReadySubtitle', 'Click the button below to start your session.')}</p>
            
            {autoMode && (
                <div className="flex items-center space-x-2 mb-8">
                    <Label htmlFor="timeout-value" className="whitespace-nowrap">{t('autoModeTimeout')}</Label>
                    <Input
                    id="timeout-value"
                    type="number"
                    min="1"
                    max="60"
                    value={timeoutValue}
                    onChange={(e) => setTimeoutValue(Math.max(1, Math.min(60, Number(e.target.value))))}
                    className="w-16"
                    />
                    <span>{t('seconds')}</span>
                </div>
            )}

            <Button onClick={handleStartSession} size="lg">
                {t('startSessionButton', 'Start Session')}
            </Button>
        </Card>
      </div>
    )
  }

  if (selections.length === 0) {
    return <p className="text-center p-8">No text items available for dictation.</p>
  }

  if (showSummary) {
    const totalItems = sessionResults.length
    const correctOnFirstTry = sessionResults.filter(r => r.is_correct_on_first_try).length
    const firstTryAccuracy = totalItems > 0 ? (correctOnFirstTry / totalItems) * 100 : 0
    const avgCharAccuracy = sessionResults.reduce((acc, r) => acc + r.character_accuracy, 0) / totalItems
    const avgTime = sessionResults.reduce((acc, r) => acc + r.completion_time_seconds, 0) / totalItems

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Card className="p-6">
          <h2 className="text-3xl font-bold mb-4 text-center text-purple-700">Dictation Complete!</h2>
          <div className="text-center my-6 space-y-4">
            <BarChart className="w-16 h-16 mx-auto text-purple-500" />
            <div className="flex justify-center items-stretch gap-2">
              <div className="p-3 bg-purple-50 rounded-lg w-1/3 flex flex-col justify-center">
                <p className="text-2xl font-bold">{firstTryAccuracy.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">First-Try Accuracy</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg w-1/3 flex flex-col justify-center">
                <p className="text-2xl font-bold">{avgCharAccuracy.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">Character Accuracy</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg w-1/3 flex flex-col justify-center">
                <p className="text-2xl font-bold">{avgTime.toFixed(1)}s</p>
                <p className="text-xs text-gray-600">Avg. Time</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {sessionResults.map((result, index) => (
              <Card key={index} className="p-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  {result.is_correct_on_first_try ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-grow">
                    <p className="font-semibold text-sm text-gray-700 truncate">{result.original_text}</p>
                    <p className="text-xs text-gray-500">Your input: {result.user_input}</p>
                  </div>
                  <div className="text-right flex-shrink-0 w-28">
                     <p className="font-bold text-sm">{result.character_accuracy.toFixed(1)}% / {result.completion_time_seconds}s</p>
                     <p className="text-xs text-gray-500">Accuracy / Time</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Button onClick={handleRestart}>Practice Again</Button>
          </div>
        </Card>
      </div>
    )
  }

  const currentSelection = selections[currentSelectionIndex]

  return (
    <div className="p-4 max-w-2xl mx-auto relative">
      <Card className="p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('dictationTitle')}</h2>
          <DictationModeSettings 
            autoMode={autoMode}
            setAutoMode={setAutoMode}
            timeoutValue={timeoutValue}
            setTimeoutValue={setTimeoutValue}
            timeLeft={timeLeft}
            mode={mode}
            setMode={setMode}
          />
        </div>
        
        <p className="text-sm text-gray-500 mb-6">{t('itemCounter', { current: currentSelectionIndex + 1, total: selections.length })}</p>
        
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-2xl flex flex-col items-center justify-center">
              <div className="bg-blue-500 rounded-full w-32 h-32 flex items-center justify-center shadow-lg">
                <div className="text-6xl font-bold text-white">
                  {countdown}
                </div>
              </div>
              <p className="mt-6 text-gray-800 text-xl font-medium">{t('autoModeCountdown')}</p>
            </div>
          </div>
        )}
        
        {(!autoMode || autoSessionStarted || countdown === null) && (
          <>
            <div className="text-center my-8 p-4 bg-purple-50 rounded-lg">
              <Button 
                onClick={handleListen} 
                size="lg" 
                variant="outline"
                disabled={countdown !== null}
              >
                <Volume2 className="w-6 h-6 mr-2" />
                {t('playSoundButton')}
              </Button>
              <p className="text-sm text-gray-500 mt-2">{t('clickToHearAudio')}</p>
            </div>

            {mode === 'typing' ? (
              <>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={t('typeHerePlaceholder')}
                  className="mb-4 text-lg"
                  rows={4}
                  disabled={isCorrect === true || autoMode}
                />
                {isCorrect !== null && (
                  <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-bold text-lg">{t('comparison')}</h3>
                    <p className="font-semibold text-gray-700">{t('originalText')} <span className="font-normal">{currentSelection.content}</span></p>
                    <p className="font-semibold text-gray-700">{t('yourInput')} <span className="font-normal">{userInput}</span></p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-bold text-lg mb-2">{t('paperModeTitle')}</h3>
                  <p className="text-gray-700">
                    {t('paperModeInstructions')}
                  </p>
                </div>
                {paperInputChecked && (
                  <div className="mb-4 p-4 border rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-500 inline mr-2" />
                    <span className="text-green-700">{t('paperModeCompleted')}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-around items-center">
              {autoMode ? (
                timeLeft > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-semibold">{timeLeft}s</p>
                    <p className="text-sm text-gray-500">{t('autoModeInProgress')}</p>
                  </div>
                )
              ) : (
                <Button onClick={handleCheckAnswerAndNext} size="lg">
                  {currentSelectionIndex < selections.length - 1 ? t('nextButton') : t('finishButton')}
                </Button>
              )}
            </div>
          </>
        )}
        
        <div className="mt-4 h-6 text-center">
          {isCorrect === true && mode === 'typing' && <p className="text-green-500 font-bold">{t('correctFeedback')}</p>}
          {isCorrect === true && mode === 'paper' && <p className="text-green-500 font-bold">{t('paperModeMarkedComplete')}</p>}
          {isCorrect === false && mode === 'typing' && <p className="text-red-500 font-bold">{t('incorrectFeedback')}</p>}
        </div>
      </Card>
    </div>
  )
}