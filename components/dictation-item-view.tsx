'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Volume2, CheckCircle, XCircle } from "lucide-react"
import { useTranslation } from 'react-i18next'

interface DictationItemViewProps {
  currentSelection: any
  userInput: string
  setUserInput: (value: string) => void
  isCorrect: boolean | null
  paperInputChecked: boolean
  mode: 'typing' | 'paper'
  autoMode: boolean
  timeLeft: number
  countdown: number | null
  onListen: () => void
  onPrevious: () => void
  onNext: () => void
  onCheck: () => void
  itemCounter: string
  isLastItem: boolean
}

export function DictationItemView({
  currentSelection,
  userInput,
  setUserInput,
  isCorrect,
  paperInputChecked,
  mode,
  autoMode,
  timeLeft,
  countdown,
  onListen,
  onPrevious,
  onNext,
  onCheck,
  itemCounter,
  isLastItem
}: DictationItemViewProps) {
  const { t } = useTranslation()

  const getAnimationClass = (direction: 'left' | 'right' | 'none') => {
    switch (direction) {
      case 'left':
        return 'transform -translate-x-full'
      case 'right':
        return 'transform translate-x-full'
      default:
        return 'transform-none'
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto relative overflow-hidden">
      <Card className={`p-6 relative transition-transform duration-300 ease-in-out ${getAnimationClass('none')}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('dictationTitle')}</h2>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">{itemCounter}</p>
        
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
        
        <div className="text-center my-8 p-4 bg-purple-50 rounded-lg">
              <Button 
                onClick={onListen} 
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
                <div className="flex justify-between w-full">
                  <Button onClick={onPrevious} size="lg" variant="outline" disabled={false}>Previous</Button>
                  <Button onClick={onNext} size="lg">
                    {isLastItem ? t('finishButton') : t('nextButton')}
                  </Button>
                </div>
              )}
        </div>
        
        <div className="mt-4 h-6 text-center">
          {isCorrect === true && mode === 'typing' && <p className="text-green-500 font-bold">{t('correctFeedback')}</p>}
          {isCorrect === true && mode === 'paper' && <p className="text-green-500 font-bold">{t('paperModeMarkedComplete')}</p>}
          {isCorrect === false && mode === 'typing' && <p className="text-red-500 font-bold">{t('incorrectFeedback')}</p>}
        </div>
      </Card>
    </div>
  )
}