export function tagsToString(tags: string[]): string {
  return tags.join(', ')
}

export function stringToTags(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
