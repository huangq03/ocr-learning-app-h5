import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Timer } from "lucide-react"
import { useTranslation } from 'react-i18next'

interface AutoModeSettingsProps {
  autoMode: boolean
  setAutoMode: (value: boolean) => void
  timeoutValue: number
  setTimeoutValue: (value: number) => void
  timeLeft: number
  mode: string
  setMode: (value: string) => void
}

export function AutoModeSettings({
  autoMode,
  setAutoMode,
  timeoutValue,
  setTimeoutValue,
  timeLeft,
  mode,
  setMode
}: AutoModeSettingsProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex items-center space-x-4">
        {/* Auto Mode Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-mode"
            checked={autoMode}
            onCheckedChange={setAutoMode}
          />
          <Label htmlFor="auto-mode">{t('autoMode')}</Label>
        </div>
        
        {/* Dictation Mode Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{t('dictationModeLabel')}</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="border rounded p-1 text-sm"
            disabled={autoMode} // Disable mode change in auto mode
          >
            <option value="typing">{t('dictationModeType')}</option>
            <option value="paper">{t('dictationModePaper')}</option>
          </select>
        </div>
      </div>
      
      {/* Auto Mode Settings */}
      {autoMode && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="timeout-value">{t('autoModeTimeout')}</Label>
            <Input
              id="timeout-value"
              type="number"
              min="1"
              max="60"
              value={timeoutValue}
              onChange={(e) => setTimeoutValue(Math.max(1, Math.min(60, Number(e.target.value))))}
              className="w-20"
            />
            <span>{t('seconds')}</span>
          </div>
          <div className="flex items-center">
            <Timer className="w-5 h-5 mr-2 text-blue-500" />
            <span className="font-bold">{timeLeft}s</span>
          </div>
        </div>
      )}
    </>
  )
}