import { useRef, useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { companiesAssets } from '@/assets'

const MAX_LOGO_BYTES = 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Picks a company logo and previews it; the page uploads the file when the form is saved. */
export function CompanyLogoPicker({
  src,
  onPick,
  onRemove,
}: {
  /** The current logo, or null to show the placeholder. */
  src: string | null
  onPick: (file: File, preview: string) => void
  /** Offered only while there is a logo to remove. */
  onRemove?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

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
        <img src={src ?? companiesAssets.company} alt="شعار الشركة" />
      </span>
      <div className="company-logo-picker__body">
        <strong>شعار الشركة</strong>
        <small>PNG أو JPG أو WEBP، بحد أقصى 1 ميجابايت</small>
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
