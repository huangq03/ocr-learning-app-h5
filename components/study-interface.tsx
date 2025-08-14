"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface StudyInterfaceProps {
  user: User
  dueItems: any[]
}

export default function StudyInterface({ user, dueItems }: StudyInterfaceProps) {
  const [reviews, setReviews] = useState(dueItems)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)

  const handleReview = useCallback(async (ease: "easy" | "good" | "hard") => {
    const currentReview = reviews[currentReviewIndex]
    if (!currentReview) return

    let newIntervalDays: number
    let newEaseFactor: number

    if (ease === "easy") {
      newIntervalDays = currentReview.interval_days * 4
      newEaseFactor = currentReview.ease_factor + 0.15
    } else if (ease === "good") {
      newIntervalDays = currentReview.interval_days * currentReview.ease_factor
      newEaseFactor = currentReview.ease_factor
    } else { // hard
      newIntervalDays = Math.max(1, currentReview.interval_days / 2)
      newEaseFactor = Math.max(1.3, currentReview.ease_factor - 0.2)
    }

    const newDueDate = new Date(Date.now() + newIntervalDays * 24 * 60 * 60 * 1000)

    const { error } = await supabase
      .from("reviews")
      .update({
        due_date: newDueDate.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        interval_days: newIntervalDays,
        ease_factor: newEaseFactor,
      })
      .eq("id", currentReview.id)

    if (error) {
      console.error("Failed to update review:", error)
    } else {
      setCurrentReviewIndex(currentReviewIndex + 1)
    }
  }, [reviews, currentReviewIndex])

  if (reviews.length === 0) {
    return <p>No reviews due today.</p>
  }

  if (currentReviewIndex >= reviews.length) {
    return <p>All reviews completed for today!</p>
  }

  const currentReview = reviews[currentReviewIndex]

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Study Session</h2>
        <div className="text-center text-3xl font-bold my-8">
          {currentReview.text_items.content}
        </div>
        <div className="flex justify-around">
          <Button onClick={() => handleReview("hard")} variant="destructive">Hard</Button>
          <Button onClick={() => handleReview("good")}>Good</Button>
          <Button onClick={() => handleReview("easy")} className="bg-green-500">Easy</Button>
        </div>
      </Card>
    </div>
  )
}
