import type { ProviderId } from './types'

interface ModelPricing {
  inputPer1M: number
  outputPer1M: number
}

/**
 * Approximate USD pricing per 1M tokens, as of this writing — providers change prices often, so
 * this is directional only (shown in the UI as "estimado"), never used for anything but a rough
 * heads-up before running a test. OpenRouter model strings are free-form, so only a handful of
 * common ones are mapped; anything else shows "N/D".
 */
const PRICING: Partial<Record<ProviderId, Record<string, ModelPricing>>> = {
  openai: {
    'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6 },
    'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10 },
    'gpt-4.1-mini': { inputPer1M: 0.4, outputPer1M: 1.6 }
  },
  anthropic: {
    'claude-sonnet-5': { inputPer1M: 3, outputPer1M: 15 },
    'claude-haiku-4-5-20251001': { inputPer1M: 0.8, outputPer1M: 4 },
    'claude-opus-4-8': { inputPer1M: 15, outputPer1M: 75 }
  },
  gemini: {
    'gemini-2.5-flash': { inputPer1M: 0.3, outputPer1M: 2.5 },
    'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10 }
  },
  openrouter: {
    'openai/gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6 },
    'anthropic/claude-sonnet-5': { inputPer1M: 3, outputPer1M: 15 },
    'meta-llama/llama-3.1-70b-instruct': { inputPer1M: 0.35, outputPer1M: 0.4 }
  }
}

const CHARS_PER_TOKEN = 4
const BASE_SYSTEM_PROMPT_TOKENS = 180
const BASE_USER_PROMPT_TOKENS = 40
const AVG_OUTPUT_TOKENS_PER_RESPONSE = 180

export interface CostEstimate {
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedCostUsd: number | null
}

export function estimateTestCost(args: {
  provider: ProviderId
  model: string
  personaCount: number
  stimulusChars: number
  stageCount?: number
}): CostEstimate {
  const stages = Math.max(1, args.stageCount ?? 1)
  const stimulusTokens = Math.ceil(args.stimulusChars / CHARS_PER_TOKEN)

  const inputTokensPerCall = BASE_SYSTEM_PROMPT_TOKENS + BASE_USER_PROMPT_TOKENS + stimulusTokens
  const totalCalls = args.personaCount * stages

  const estimatedInputTokens = inputTokensPerCall * totalCalls
  const estimatedOutputTokens = AVG_OUTPUT_TOKENS_PER_RESPONSE * totalCalls

  if (args.provider === 'local') {
    return { estimatedInputTokens, estimatedOutputTokens, estimatedCostUsd: 0 }
  }

  const pricing = PRICING[args.provider]?.[args.model]
  if (!pricing) {
    return { estimatedInputTokens, estimatedOutputTokens, estimatedCostUsd: null }
  }

  const cost = (estimatedInputTokens / 1_000_000) * pricing.inputPer1M + (estimatedOutputTokens / 1_000_000) * pricing.outputPer1M
  return { estimatedInputTokens, estimatedOutputTokens, estimatedCostUsd: cost }
}
