import { useRef, useState } from 'react'
import { Trash2, Upload } from 'lucide-react'

const MAX_LOGO_BYTES = 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** A company's uploaded logo, or the first letter of its name when it has none. */
export function CompanyMark({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  return logoUrl ? (
    <img src={logoUrl} alt={name} className={className} />
  ) : (
    <span className="company-mark">{name.trim().charAt(0)}</span>
  )
}

/** Picks a company logo and previews it; the page uploads the file when the form is saved. */
export function CompanyLogoPicker({
  src,
  name,
  onPick,
  onRemove,
}: {
  /** The company's name; its first letter stands in until a logo is uploaded. */
  name?: string
  /** The current logo, or null to show the placeholder. */
  src: string | null
  onPick: (file: File, preview: string) => void
  /** Offered only while there is a logo to remove. */
  onRemove?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const initial = (name ?? '').trim().charAt(0) || 'ش'

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!LOGO_TYPES.includes(file.type)) {
      setError('الرجاء اختيار صورة PNG أو JPG أو WEBP')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('حجم الشعار يجب ألا يتجاوز 1 ميجابايت')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => onPick(file, String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="company-logo-picker">
      <span className="company-logo-picker__preview">
        {src ? <img src={src} alt="شعار الشركة" /> : <span className="company-mark">{initial}</span>}
      </span>
      <div className="company-logo-picker__body">
        <strong>شعار الشركة (اختياري)</strong>
        <small>الصيغ: PNG أو JPG أو WEBP — حتى 1 ميجابايت</small>
        {error ? <small className="company-logo-picker__error">{error}</small> : null}
        <div className="company-logo-picker__actions">
          <button type="button" className="departments-outline" onClick={() => inputRef.current?.click()}>
            <Upload size={16} />
            <span>{src ? 'تغيير الشعار' : 'رفع الشعار'}</span>
          </button>
          {src && onRemove ? (
            <button type="button" className="departments-outline" onClick={onRemove}>
              <Trash2 size={16} />
              <span>إزالة</span>
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        aria-label="شعار الشركة"
        onChange={onChange}
      />
    </div>
  )
}
