import { authAssets, brandAssets } from '@/assets'

type TrackLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  stacked?: boolean
}

const sizes = {
  sm: { stacked: 56, inline: 120 },
  md: { stacked: 72, inline: 148 },
  lg: { stacked: 96, inline: 180 },
}

export function TrackLogo({ size = 'md', stacked = false }: TrackLogoProps) {
  const s = sizes[size]

  if (stacked) {
    return (
      <div className="track-logo track-logo--stacked" aria-label="TrackPlus">
        <img
          src={authAssets.loginLogo}
          alt="TrackPlus"
          height={s.stacked}
          className="track-logo__full"
        />
      </div>
    )
  }

  return (
    <div className="track-logo track-logo--inline" aria-label="TrackPlus">
      <img
        src={brandAssets.logoFull}
        alt="TrackPlus"
        height={s.inline * 0.28}
        className="track-logo__full"
      />
    </div>
  )
}
