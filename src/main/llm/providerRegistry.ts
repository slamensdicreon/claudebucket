import type { LlmProvider } from './types'
import { openaiProvider } from './providers/openai'
import { anthropicProvider } from './providers/anthropic'
import { geminiProvider } from './providers/gemini'
import { openrouterProvider } from './providers/openrouter'

/** Real network-backed providers only — 'local' is handled separately (see localGenerators.ts). */
export const providerRegistry = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  openrouter: openrouterProvider
} satisfies Record<'openai' | 'anthropic' | 'gemini' | 'openrouter', LlmProvider>
