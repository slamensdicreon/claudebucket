/** Minimal concurrency limiter — runs at most `limit` tasks from `items` at once, preserving order of results. */
export async function runWithConcurrencyLimit<TItem, TResult>(
  items: TItem[],
  limit: number,
  task: (item: TItem, index: number) => Promise<TResult>
): Promise<TResult[]> {
  const results: TResult[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await task(items[index], index)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}
