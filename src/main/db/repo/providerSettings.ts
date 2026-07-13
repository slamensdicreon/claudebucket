import { and, eq, isNull } from 'drizzle-orm'
import { safeStorage } from 'electron'
import { getDb } from '../client'
import { providerSettings } from '../schema'
import { newId } from '../ids'
import { PROVIDER_IDS, PROVIDER_DEFAULT_MODELS, type ProviderId, type ProviderSetting } from '@shared/types'

function scopeFilter(provider: ProviderId, workspaceId: string | null) {
  return workspaceId
    ? and(eq(providerSettings.provider, provider), eq(providerSettings.workspaceId, workspaceId))
    : and(eq(providerSettings.provider, provider), isNull(providerSettings.workspaceId))
}

function toSetting(row: typeof providerSettings.$inferSelect): ProviderSetting {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    provider: row.provider as ProviderId,
    hasApiKey: Boolean(row.apiKeyEncrypted),
    defaultModel: row.defaultModel
  }
}

/** Global (workspaceId = null) settings row for every provider, creating defaults on first read. */
export function listGlobalProviderSettings(): ProviderSetting[] {
  const db = getDb()
  return PROVIDER_IDS.map((provider) => {
    let row = db.select().from(providerSettings).where(scopeFilter(provider, null)).get()
    if (!row) {
      const inserted = {
        id: newId(),
        workspaceId: null,
        provider,
        apiKeyEncrypted: null,
        apiKeyPlaintextFallback: false,
        defaultModel: PROVIDER_DEFAULT_MODELS[provider][0]
      }
      db.insert(providerSettings).values(inserted).run()
      row = inserted as typeof providerSettings.$inferSelect
    }
    return toSetting(row)
  })
}

export function setApiKey(provider: ProviderId, workspaceId: string | null, apiKey: string): void {
  const db = getDb()
  const canEncrypt = safeStorage.isEncryptionAvailable()
  const stored = canEncrypt ? safeStorage.encryptString(apiKey).toString('base64') : apiKey
  const existing = db.select().from(providerSettings).where(scopeFilter(provider, workspaceId)).get()
  if (existing) {
    db.update(providerSettings)
      .set({ apiKeyEncrypted: stored, apiKeyPlaintextFallback: !canEncrypt })
      .where(eq(providerSettings.id, existing.id))
      .run()
  } else {
    db.insert(providerSettings)
      .values({
        id: newId(),
        workspaceId,
        provider,
        apiKeyEncrypted: stored,
        apiKeyPlaintextFallback: !canEncrypt,
        defaultModel: PROVIDER_DEFAULT_MODELS[provider][0]
      })
      .run()
  }
}

export function clearApiKey(provider: ProviderId, workspaceId: string | null): void {
  const db = getDb()
  db.update(providerSettings)
    .set({ apiKeyEncrypted: null, apiKeyPlaintextFallback: false })
    .where(scopeFilter(provider, workspaceId))
    .run()
}

export function setDefaultModel(provider: ProviderId, workspaceId: string | null, model: string): void {
  const db = getDb()
  const existing = db.select().from(providerSettings).where(scopeFilter(provider, workspaceId)).get()
  if (existing) {
    db.update(providerSettings).set({ defaultModel: model }).where(eq(providerSettings.id, existing.id)).run()
  } else {
    db.insert(providerSettings)
      .values({
        id: newId(),
        workspaceId,
        provider,
        apiKeyEncrypted: null,
        apiKeyPlaintextFallback: false,
        defaultModel: model
      })
      .run()
  }
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

/** Resolves the decrypted API key + model to actually use for a provider call: workspace override, else global. */
export function resolveProviderCredentials(
  provider: ProviderId,
  workspaceId: string | null
): { apiKey: string | null; model: string } {
  const db = getDb()
  const wsRow = workspaceId ? db.select().from(providerSettings).where(scopeFilter(provider, workspaceId)).get() : undefined
  const globalRow = db.select().from(providerSettings).where(scopeFilter(provider, null)).get()

  const row = wsRow?.apiKeyEncrypted ? wsRow : globalRow ?? wsRow

  let apiKey: string | null = null
  if (row?.apiKeyEncrypted) {
    apiKey = row.apiKeyPlaintextFallback
      ? row.apiKeyEncrypted
      : safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(Buffer.from(row.apiKeyEncrypted, 'base64'))
        : null
  }

  const model = row?.defaultModel ?? PROVIDER_DEFAULT_MODELS[provider][0]
  return { apiKey, model }
}
