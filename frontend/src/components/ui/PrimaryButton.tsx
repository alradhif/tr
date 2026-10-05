import { Button } from 'antd'
import type { ButtonProps } from 'antd'

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      type="primary"
      className={['sa-primary-btn', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
