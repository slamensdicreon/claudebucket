import { hashSeed, mulberry32 } from './seededRandom'

export interface AvatarSpec {
  initials: string
  colorFrom: string
  colorTo: string
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Deterministic seed → avatar spec (initials + gradient), no network/deps. Same seed always gives the same avatar. */
export function generateAvatarSpec(seed: string, displayName: string): AvatarSpec {
  const rng = mulberry32(hashSeed(seed))
  const hueFrom = Math.floor(rng() * 360)
  const hueTo = (hueFrom + 40 + Math.floor(rng() * 60)) % 360
  return {
    initials: initialsFrom(displayName),
    colorFrom: `hsl(${hueFrom} 65% 45%)`,
    colorTo: `hsl(${hueTo} 60% 38%)`
  }
}

export function avatarSvgDataUri(seed: string, displayName: string, size = 64): string {
  const { initials, colorFrom, colorTo } = generateAvatarSpec(seed, displayName)
  const gradientId = `g${hashSeed(seed)}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorFrom}" />
        <stop offset="100%" stop-color="${colorTo}" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size / 2}" fill="url(#${gradientId})" />
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700"
      font-size="${size * 0.36}" fill="#0b0c0e">${initials}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
