const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * fetch() with exponential backoff + jitter on rate-limit/server-error responses (429, 5xx).
 * Honors a numeric `Retry-After` header (seconds) when the provider sends one. Non-retryable
 * responses (including 4xx auth/validation errors) are returned immediately for the caller to
 * inspect — this only smooths over transient failures, it never throws on a bad status itself.
 */
export async function fetchWithBackoff(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0
  for (;;) {
    const res = await fetch(url, init)
    if (res.ok || attempt >= maxRetries || !RETRYABLE_STATUS.has(res.status)) return res

    const retryAfterHeader = res.headers.get('retry-after')
    const retryAfterMs = retryAfterHeader && !Number.isNaN(Number(retryAfterHeader)) ? Number(retryAfterHeader) * 1000 : null
    const backoffMs = retryAfterMs ?? Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250

    await sleep(backoffMs)
    attempt++
  }
}
