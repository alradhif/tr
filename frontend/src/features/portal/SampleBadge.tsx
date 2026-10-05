import type { ReactNode } from 'react'

/** Kept for compatibility. Live widgets must not show a sample-data badge. */
export function SampleBadge({ show: _show }: { show: boolean }): ReactNode {
  return null
}
