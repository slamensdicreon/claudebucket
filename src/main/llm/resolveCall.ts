import type { Persona, ProviderId } from '@shared/types'
import { resolveProviderCredentials } from '../db/repo/providerSettings'
import type { ProviderCall } from './useCases'

/** Resolves which provider/model/apiKey to actually use, honoring a persona's own override if set. */
export function resolveCallForPersona(
  persona: Persona | null,
  workspaceId: string,
  requestedProvider: ProviderId,
  requestedModel?: string | null
): ProviderCall {
  const provider = persona?.llmProviderOverride ?? requestedProvider
  if (provider === 'local') return { provider: 'local', apiKey: null, model: 'local-deterministic-v1' }

  const resolved = resolveProviderCredentials(provider, workspaceId)
  const model = persona?.llmModelOverride ?? requestedModel ?? resolved.model
  return { provider, apiKey: resolved.apiKey, model }
}

export function resolveCall(workspaceId: string, requestedProvider: ProviderId, requestedModel?: string | null): ProviderCall {
  return resolveCallForPersona(null, workspaceId, requestedProvider, requestedModel)
}
