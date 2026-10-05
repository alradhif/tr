import { useEffect, type ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import arEG from 'antd/locale/ar_EG'
import { antdTheme } from '../theme/antdTheme'

type RtlProviderProps = {
  children: ReactNode
}

export function RtlProvider({ children }: RtlProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('dir', 'rtl')
    root.setAttribute('lang', 'ar')
    document.body.dir = 'rtl'
  }, [])

  return (
    <ConfigProvider
      direction="rtl"
      locale={arEG}
      theme={antdTheme}
      form={{
        requiredMark: false,
      }}
    >
      {children}
    </ConfigProvider>
  )
}
