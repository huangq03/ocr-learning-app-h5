"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@supabase/supabase-js"

interface DictationInterfaceProps {
  user: User
  textItems: any[]
}

export default function DictationInterface({ user, textItems }: DictationInterfaceProps) {
  const [selections, setSelections] = useState(textItems)
  const [currentSelectionIndex, setCurrentSelectionIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const handleCheck = useCallback(() => {
    const currentSelection = selections[currentSelectionIndex]
    if (!currentSelection) return

    if (userInput.trim() === currentSelection.text) {
      setIsCorrect(true)
    } else {
      setIsCorrect(false)
    }
  }, [userInput, selections, currentSelectionIndex])

  const handleNext = () => {
    setCurrentSelectionIndex(currentSelectionIndex + 1)
    setUserInput("")
    setIsCorrect(null)
  }

  if (selections.length === 0) {
    return <p>No selections available for dictation.</p>
  }

  if (currentSelectionIndex >= selections.length) {
    return <p>Dictation practice completed!</p>
  }

  const currentSelection = selections[currentSelectionIndex]

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Dictation Practice</h2>
        <div className="text-center text-3xl font-bold my-8">
          <p>Listen to the audio and type what you hear.</p> 
          {/* Add audio playback here */}
        </div>
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type the dictation here..."
          className="mb-4"
        />
        <div className="flex justify-around">
          <Button onClick={handleCheck}>Check</Button>
          <Button onClick={handleNext} disabled={!isCorrect}>Next</Button>
        </div>
        {isCorrect === true && <p className="text-green-500 mt-4">Correct!</p>}
        {isCorrect === false && <p className="text-red-500 mt-4">Incorrect. Please try again.</p>}
      </Card>
    </div>
  )
}
