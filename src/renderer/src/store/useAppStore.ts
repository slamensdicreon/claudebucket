import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProviderId } from '@shared/types'
import type { ThemeColors, ThemeMode } from '@shared/theme'

export type Language = 'es' | 'en'

interface AppState {
  currentWorkspaceId: string | null
  currentProvider: ProviderId
  currentModel: string | null
  theme: ThemeMode
  customColors: Partial<ThemeColors>
  language: Language
  setCurrentWorkspaceId: (id: string | null) => void
  setCurrentProvider: (provider: ProviderId) => void
  setCurrentModel: (model: string | null) => void
  setTheme: (theme: ThemeMode) => void
  setCustomColor: (field: keyof ThemeColors, value: string) => void
  setLanguage: (language: Language) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      currentProvider: 'local',
      currentModel: null,
      theme: 'dark',
      customColors: {},
      language: 'es',
      setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
      setCurrentProvider: (provider) => set({ currentProvider: provider, currentModel: null }),
      setCurrentModel: (model) => set({ currentModel: model }),
      setTheme: (theme) => set({ theme }),
      setCustomColor: (field, value) => set((s) => ({ customColors: { ...s.customColors, [field]: value } })),
      setLanguage: (language) => set({ language })
    }),
    { name: 'crowdmind-app-state' }
  )
)
