import { generateAvatarSpec } from '@shared/avatar'
import { cn } from '@renderer/lib/utils'

export function Avatar({
  seed,
  name,
  size = 32,
  className,
  imageDataUri
}: {
  seed: string
  name: string
  size?: number
  className?: string
  imageDataUri?: string | null
}) {
  if (imageDataUri) {
    return (
      <img
        src={imageDataUri}
        alt={name}
        className={cn('flex-none rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  const { initials, colorFrom, colorTo } = generateAvatarSpec(seed, name)
  return (
    <div
      className={cn('flex items-center justify-center rounded-full flex-none font-mono-label font-bold text-bg', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`
      }}
    >
      {initials}
    </div>
  )
}
