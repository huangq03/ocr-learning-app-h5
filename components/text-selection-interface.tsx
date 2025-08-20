'use client'

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { saveSelectionsAndCreateReviewsAction } from "@/lib/actions"

interface TextSelectionInterfaceProps {
  user: User
  document: any
  extractedText: any
  existingItems: any[]
}

export default function TextSelectionInterface({ user, document, extractedText, existingItems }: TextSelectionInterfaceProps) {
  const router = useRouter()
  const [selections, setSelections] = useState<any[]>([])

  const handleSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      const type = selectedText.includes(" ") ? (selectedText.split(" ").length > 2 ? "string" : "phrase") : "word"
      setSelections([...selections, { text: selectedText, type }])
    }
  }

  const handleSaveSelections = useCallback(async () => {
    if (selections.length === 0) return

    const result = await saveSelectionsAndCreateReviewsAction(document.id, selections, user.id);

    if (result.error) {
      console.error("Failed to save selections:", result.error)
    } else {
      console.log("Selections and review schedules saved successfully")
      router.push("/study")
    }
  }, [document.id, selections, user.id, router])

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Select Text</h2>
        <div onMouseUp={handleSelection} className="whitespace-pre-wrap border p-4 rounded-md">
          {extractedText.raw_text}
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">New Selections:</h3>
          <ul>
            {selections.map((s, i) => (
              <li key={i}>
                <strong>{s.type}:</strong> {s.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Existing Selections:</h3>
          <ul>
            {existingItems.map((item: any) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </div>
        <Button onClick={handleSaveSelections} className="mt-4">Save Selections and Start Studying</Button>
      </Card>
    </div>
  )
}