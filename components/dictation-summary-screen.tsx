'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, CheckCircle, XCircle } from "lucide-react"
import { useTranslation } from 'react-i18next'

interface SessionResult {
  text_item_id: string
  original_text: string
  user_input: string
  attempts: number
  is_correct_on_first_try: boolean
  character_accuracy: number
  completion_time_seconds: number
}

interface SummaryScreenProps {
  sessionResults: SessionResult[]
  onRestart: () => void
}

export function SummaryScreen({ sessionResults, onRestart }: SummaryScreenProps) {
  const { t } = useTranslation()
  
  const totalItems = sessionResults.length
  const correctOnFirstTry = sessionResults.filter(r => r.is_correct_on_first_try).length
  const firstTryAccuracy = totalItems > 0 ? (correctOnFirstTry / totalItems) * 100 : 0
  const avgCharAccuracy = sessionResults.reduce((acc, r) => acc + r.character_accuracy, 0) / totalItems
  const avgTime = sessionResults.reduce((acc, r) => acc + r.completion_time_seconds, 0) / totalItems

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-3xl font-bold mb-4 text-center text-purple-700">{t('summaryTitle', 'Dictation Complete!')}</h2>
        <div className="text-center my-6 space-y-4">
          <BarChart className="w-16 h-16 mx-auto text-purple-500" />
          <div className="flex justify-center items-stretch gap-2">
            <div className="p-3 bg-purple-50 rounded-lg w-1/3 flex flex-col justify-center">
              <p className="text-2xl font-bold">{firstTryAccuracy.toFixed(1)}%</p>
              <p className="text-xs text-gray-600">{t('summaryFirstTryAccuracy', 'First-Try Accuracy')}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg w-1/3 flex flex-col justify-center">
              <p className="text-2xl font-bold">{avgCharAccuracy.toFixed(1)}%</p>
              <p className="text-xs text-gray-600">{t('summaryCharAccuracy', 'Character Accuracy')}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg w-1/3 flex flex-col justify-center">
              <p className="text-2xl font-bold">{avgTime.toFixed(1)}s</p>
              <p className="text-xs text-gray-600">{t('summaryAvgTime', 'Avg. Time')}</p>
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
                  <p className="text-xs text-gray-500">{t('summaryYourInput', 'Your input: ')}{result.user_input}</p>
                </div>
                <div className="text-right flex-shrink-0 w-28">
                   <p className="font-bold text-sm">{result.character_accuracy.toFixed(1)}% / {result.completion_time_seconds}s</p>
                   <p className="text-xs text-gray-500">{t('summaryAccuracyTime', 'Accuracy / Time')}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button onClick={onRestart}>{t('summaryPracticeAgain', 'Practice Again')}</Button>
        </div>
      </Card>
    </div>
  )
}