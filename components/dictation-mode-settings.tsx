import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTranslation } from 'react-i18next'

interface DictationModeSettingsProps {
  autoMode: boolean
  setAutoMode: (value: boolean) => void
  mode: string
  setMode: (value: string) => void
}

export function DictationModeSettings({
  autoMode,
  setAutoMode,
  mode,
  setMode
}: DictationModeSettingsProps) {
  const { t } = useTranslation()

  return (
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
          <option value="paper">{t('dictationModePaper')}</option>
          <option value="typing">{t('dictationModeType')}</option>
        </select>
      </div>
    </div>
  )
}