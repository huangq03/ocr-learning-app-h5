'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DictationModeSettings } from "@/components/dictation-mode-settings"
import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslation } from 'react-i18next'

interface StartScreenProps {
  autoMode: boolean
  setAutoMode: (value: boolean) => void
  timeoutValue: number
  setTimeoutValue: (value: number) => void
  mode: 'typing' | 'paper'
  setMode: (mode: 'typing' | 'paper') => void
  onStart: () => void
}

export function StartScreen({
  autoMode,
  setAutoMode,
  timeoutValue,
  setTimeoutValue,
  mode,
  setMode,
  onStart
}: StartScreenProps) {
  const { t, i18n } = useTranslation()

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
            <Label htmlFor="timeout-value" className="whitespace-nowrap flex items-center">
              {t('autoModeTimeout', 'Auto-mode timeout')}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 ml-1.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('autoModeTimeoutTooltip', 'The time you have to type the answer after the audio plays.')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="timeout-value"
              type="number"
              min="1"
              max="60"
              value={timeoutValue}
              onChange={(e) => setTimeoutValue(Math.max(1, Math.min(60, Number(e.target.value))))}
              className="w-16"
            />
            <span>{t('seconds', 's')}</span>
          </div>
        )}

        <Button onClick={onStart} size="lg">
          {t('startSessionButton', 'Start Session')}
        </Button>
      </Card>
    </div>
  )
}