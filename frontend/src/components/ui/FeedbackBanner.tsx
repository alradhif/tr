import type { ReactNode } from 'react';
import './feedback-banner.css';

export type BannerTone = 'success' | 'error';

interface FeedbackBannerProps {
  tone: BannerTone;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  className?: string;
}

export function FeedbackBanner({ tone, children, onClose, closeLabel = 'إغلاق', className }: FeedbackBannerProps) {
  const success = tone === 'success';
  return (
    <div
      className={`feedback-banner feedback-banner--${tone}${className ? ` ${className}` : ''}`}
      role="alert"
    >
      <div className="feedback-banner__content">
        <span className="feedback-banner__icon" aria-hidden>
          {success ? (
            <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="17" cy="17" r="14" fill="#6ec99b" />
              <path
                d="M11.5 17L15 20.5L22.5 13"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="17" cy="17" r="14" fill="#f3786a" />
              <path
                d="M12 12L22 22M22 12L12 22"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="feedback-banner__text">{children}</span>
      </div>

      <button
        type="button"
        className="feedback-banner__close"
        onClick={onClose}
        aria-label={closeLabel}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#292d32" strokeWidth="1.5" />
          <path d="M9 15L15 9M15 15L9 9" stroke="#292d32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
