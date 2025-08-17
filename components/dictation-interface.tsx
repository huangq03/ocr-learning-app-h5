"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { BarChart, CheckCircle, XCircle, Volume2, HelpCircle, Timer } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const [selections, setSelections] = useState(textItems)
  const [currentSelectionIndex, setCurrentSelectionIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())

  useEffect(() => {
    setStartTime(Date.now())
  }, [currentSelectionIndex])

  const handleCheck = useCallback(() => {
    const currentSelection = selections[currentSelectionIndex]
    if (!currentSelection) return

    setAttempts(prev => prev + 1)
    if (userInput.trim().toLowerCase() === currentSelection.content.toLowerCase()) {
      setIsCorrect(true)
    } else {
      setIsCorrect(false)
    }
  }, [userInput, selections, currentSelectionIndex])

  const handleNext = async () => {
    const endTime = Date.now()
    const completionTime = Math.round((endTime - startTime) / 1000)
    const currentSelection = selections[currentSelectionIndex]
    const isCorrectOnFirstTry = attempts === 1 && isCorrect
    const characterAccuracy = calculateAccuracy(currentSelection.content, userInput.trim())

    const result: SessionResult = {
      text_item_id: currentSelection.id,
      original_text: currentSelection.content,
      user_input: userInput.trim(),
      attempts: attempts,
      is_correct_on_first_try: isCorrectOnFirstTry,
      character_accuracy: characterAccuracy,
      completion_time_seconds: completionTime,
    }
    setSessionResults([...sessionResults, result])

    await supabase.from("dictation_exercises").insert({
      user_id: user.id,
      text_item_id: result.text_item_id,
      target_text: result.original_text,
      user_input: result.user_input,
      accuracy_score: characterAccuracy,
      mistakes_count: attempts - 1,
      completion_time_seconds: completionTime,
      completed_at: new Date().toISOString(),
    })

    if (currentSelectionIndex < selections.length - 1) {
      setCurrentSelectionIndex(currentSelectionIndex + 1)
      setUserInput("")
      setIsCorrect(null)
      setAttempts(0)
    } else {
      setShowSummary(true)
    }
  }

  const handleRestart = () => {
    setCurrentSelectionIndex(0)
    setUserInput("")
    setIsCorrect(null)
    setAttempts(0)
    setSessionResults([])
    setShowSummary(false)
  }

  const handleListen = () => {
    const currentSelection = selections[currentSelectionIndex]
    if (!currentSelection || typeof window === 'undefined') return
    const utterance = new SpeechSynthesisUtterance(currentSelection.content)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
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
    <div className="p-4 max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-2">Dictation Practice</h2>
        <p className="text-sm text-gray-500 mb-6">Item {currentSelectionIndex + 1} of {selections.length}</p>
        <div className="text-center my-8 p-4 bg-purple-50 rounded-lg">
          <Button onClick={handleListen} size="lg" variant="outline">
            <Volume2 className="w-6 h-6 mr-2" />
            Listen
          </Button>
          <p className="text-sm text-gray-500 mt-2">Click to hear the audio</p>
        </div>
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type what you hear..."
          className="mb-4 text-lg"
          rows={4}
          disabled={isCorrect === true}
        />
        {isCorrect !== null && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-bold text-lg">Comparison</h3>
            <p className="font-semibold text-gray-700">Original: <span className="font-normal">{currentSelection.content}</span></p>
            <p className="font-semibold text-gray-700">Your input: <span className="font-normal">{userInput}</span></p>
          </div>
        )}
        <div className="flex justify-around items-center">
          <Button onClick={handleCheck} size="lg" disabled={isCorrect === true}>Check</Button>
          <Button onClick={handleNext} disabled={isCorrect !== true} size="lg">
            {currentSelectionIndex < selections.length - 1 ? "Next" : "Finish"}
          </Button>
        </div>
        <div className="mt-4 h-6 text-center">
          {isCorrect === true && <p className="text-green-500 font-bold">Correct!</p>}
          {isCorrect === false && <p className="text-red-500 font-bold">Incorrect. Please try again.</p>}
        </div>
      </Card>
    </div>
  )
}
