import { brandAssets } from '@/assets'

export function AuthCardHeader() {
  return (
    <div className="auth-card__brand">
      <img src={brandAssets.logoMark} alt="" className="auth-card__brand-icon" />
      <span className="auth-card__brand-word">
        track<span className="auth-card__brand-plus">+</span>
      </span>
    </div>
  )
}
