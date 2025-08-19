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

  useEffect(() => {
    setStartTime(Date.now())
    // When changing items in auto mode (after the first one), start the item countdown
    if (autoMode && autoSessionStarted && currentSelectionIndex > -1) {
      console.log('XXXXXXXX: To call autoPlayWithCountdown due to currentSelectionIndex change:', currentSelectionIndex)
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
    console.log('XXXXXXXX: handleNext called with currentSelectionIndex:', currentSelectionIndex, 'selections length:', selections.length)
    if (currentSelectionIndex < selections.length - 1) {
      setCurrentSelectionIndex(currentSelectionIndex + 1)
      setUserInput("")
      setIsCorrect(null)
      setAttempts(0)
      setPaperInputChecked(false) // Reset paper mode verification
      // Reset timer for next item
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
    setPaperInputChecked(false) // Reset paper mode verification
    setAutoSessionStarted(false) // Reset auto session
    setCountdown(null) // Reset countdown
    setTimeLeft(0) // Reset timer
  }

  // Auto play audio in auto mode with countdown
  const autoPlayWithCountdown = () => {
    if (!autoMode) return;
    
    // Clear any existing countdown
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null
    }
    
    // Clear any existing timeout
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
    
    // Start 3-second countdown
    console.log('XXXXXXXX: Starting countdown for auto mode')
    setCountdown(3)
    countdownRef.current = setTimeout(() => {
      setCountdown(2)
      console.log('XXXXXXXX: Countdown at 2 seconds')
      countdownRef.current = setTimeout(() => {
        setCountdown(1)
        console.log
        countdownRef.current = setTimeout(() => {
          setCountdown(null)
          console.log('XXXXXXXX: Countdown finished, calling handleListen')
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
    
    // Set up event listener for when speech ends
    utterance.onend = () => {
      // Start the timeout countdown after audio is finished
      if (autoMode && autoSessionStarted) {
        console.log('XXXXXXXX: Audio ended, starting timeout countdown with timeoutValue:', timeoutValue)
        setTimeLeft(timeoutValue)
      }
    }
    
    window.speechSynthesis.speak(utterance)
  }

  // Start auto session
  const startAutoSession = () => {
    console.log('XXXXXXXX: startAutoSession called with timeoutValue:', timeoutValue)
    setAutoSessionStarted(true)
    // setTimeLeft is called in handleListen's onend callback
    handleNext() // Move to the first item
  }

  // Reset auto session
  const resetAutoSession = () => {
    setAutoSessionStarted(false)
    setCountdown(null)
    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  // Reset auto session when auto mode is disabled
  useEffect(() => {
    if (!autoMode) {
      resetAutoSession();
    }
  }, [autoMode]);

  // Auto mode timer effect
  useEffect(() => {
    // Don't run if not in auto mode, showing summary, not started, or in item countdown
    if (!autoMode || showSummary || !autoSessionStarted || countdown !== null) return

    // Only run the timeout countdown if we've set a value (after audio plays)
    if (timeLeft > 0) {
      console.log('XXXXXXXX: Auto mode timer running with timeLeft:', timeLeft)
      autoTimerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (autoTimerRef.current && timeLeft === 0) {
      // When timer reaches 0, save answer and move to next item or finish the session
      console.log('XXXXXXXX: to call handleAnswer and handleNext due to timer reaching 0')
      handleAnswer()
      handleNext()
    }

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, timeLeft, showSummary, autoSessionStarted, countdown])

  // Cleanup effect for countdown timer
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
      <Card className="p-6">
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
        
        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-blue-500 rounded-full w-32 h-32 flex items-center justify-center shadow-lg">
              <div className="text-4xl font-bold text-white">
                {countdown}
              </div>
            </div>
            <p className="absolute top-1/2 mt-24 text-gray-700 text-lg font-medium">{t('autoModeCountdown')}</p>
          </div>
        )}
        
        {/* Hide content during countdown in auto mode */}
        {(!autoMode || autoSessionStarted || countdown === null) && (
          <>
            <div className="text-center my-8 p-4 bg-purple-50 rounded-lg">
              <Button 
                onClick={handleListen} 
                size="lg" 
                variant="outline"
                disabled={countdown !== null || (autoMode && !autoSessionStarted)} // Disable during countdown or before starting auto session
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
                  disabled={isCorrect === true || autoMode} // Disable in auto mode
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
              {/* Show appropriate buttons based on mode */}
              {autoMode ? (
                !autoSessionStarted ? (
                  // Show Start Auto Session button with timeout input
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
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
                    <Button onClick={startAutoSession} size="lg">
                      {t('startAutoSession')}
                    </Button>
                  </div>
                ) : (
                  // In auto mode after starting, show timer only
                  <div className="text-center">
                    <p className="text-lg font-semibold">{timeLeft}s</p>
                    <p className="text-sm text-gray-500">{t('autoModeInProgress')}</p>
                  </div>
                )
              ) : (
                // Show regular buttons in manual mode
                <>
                  <Button onClick={handleCheck} size="lg" disabled={isCorrect === true}>
                    {mode === 'paper' ? t('markAsCompletedButton') : t('checkButton')}
                  </Button>
                  <Button onClick={handleNext} disabled={isCorrect !== true} size="lg">
                    {currentSelectionIndex < selections.length - 1 ? t('nextButton') : t('finishButton')}
                  </Button>
                </>
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
