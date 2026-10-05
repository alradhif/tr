import { useEffect, useRef } from 'react'
import './ppt-generator.css'

/** Payload sent into the companies-app iframe via postMessage. */
export type PptBridgePayload = {
  projectId?: string
  project?: {
    name?: string
    code?: string
    department?: string
    projectManager?: string
    sponsor?: string
    startDate?: string
    endDate?: string
    budget?: number
    budgetCurrency?: string
    spent?: number
    statusLabel?: string
    progress?: number
    description?: string
    remainingDays?: number
  }
  outputs?: string[]
  phases?: Array<{ name: string; progress?: number; startDate?: string; endDate?: string }>
  risks?: { high?: number; medium?: number; low?: number }
  changeRequests?: Array<{ title: string; status?: string }>
  scenarios?: string[]
  sourceLabel?: string
}

type PptGeneratorFrameProps = {
  title?: string
  className?: string
  data?: PptBridgePayload | null
}

export function PptGeneratorFrame({
  title = 'مولّد العروض التقديمية',
  className,
  data,
}: PptGeneratorFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = iframeRef.current
    if (!frame || !data) return

    const send = () => {
      frame.contentWindow?.postMessage(
        { type: 'TRACKPLUS_PPT_DATA', payload: data },
        window.location.origin,
      )
    }

    // Retry a few times in case the iframe script isn't ready yet
    send()
    const t1 = window.setTimeout(send, 400)
    const t2 = window.setTimeout(send, 1200)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [data])

  return (
    <div className={`ppt-generator${className ? ` ${className}` : ''}`}>
      <iframe
        ref={iframeRef}
        title={title}
        src="/companies-app/index.html"
        className="ppt-generator__frame"
        onLoad={() => {
          if (!data) return
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'TRACKPLUS_PPT_DATA', payload: data },
            window.location.origin,
          )
        }}
      />
    </div>
  )
}
