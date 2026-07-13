import { useAppStore } from '@renderer/store/useAppStore'
import { PROVIDER_IDS, PROVIDER_LABELS } from '@shared/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'

export function ProviderSwitcher() {
  const provider = useAppStore((s) => s.currentProvider)
  const setProvider = useAppStore((s) => s.setCurrentProvider)

  return (
    <Select value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
      <SelectTrigger className="w-[190px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROVIDER_IDS.map((id) => (
          <SelectItem key={id} value={id}>
            {PROVIDER_LABELS[id]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
