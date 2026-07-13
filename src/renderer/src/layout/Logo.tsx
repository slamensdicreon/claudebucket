import logoMark from '@renderer/assets/logo-mark.png'

export function Logo({ withWordmark = true, size = 26 }: { withWordmark?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex flex-none items-center justify-center overflow-hidden rounded-md"
        style={{ width: size, height: size, background: '#0b0c0e' }}
      >
        <img src={logoMark} alt="Crowdmind" className="h-full w-full scale-125 object-cover" />
      </div>
      {withWordmark && (
        <span className="font-mono-label text-[13.5px] font-semibold tracking-wide text-text">CROWDMIND</span>
      )}
    </div>
  )
}
