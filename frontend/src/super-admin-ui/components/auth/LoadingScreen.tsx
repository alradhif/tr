import { brandAssets } from '@/assets'
import { AuthBackground } from './AuthBackground'
import './auth.css'

interface LoadingScreenProps {
  label?: string
}

export function LoadingScreen({ label = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <AuthBackground />
      <div className="loading-screen__content">
        <img src={brandAssets.logoMark} alt="" className="loading-screen__icon" />
        <span className="loading-screen__word">
          track<span className="auth-card__brand-plus">+</span>
        </span>
        <div className="loading-screen__ring" aria-hidden="true" />
        <span className="loading-screen__label">{label}</span>
      </div>
    </div>
  )
}
