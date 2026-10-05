import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  consumePostAuthDestination,
  peekPostAuthDestination,
  POST_AUTH_LOADING_MS,
} from '../../auth/postAuthLoading'
import { LoadingScreen } from '../../super-admin-ui/components/auth/LoadingScreen'

export function PostAuthLoadingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const dest = peekPostAuthDestination()
    if (!dest) {
      navigate('/login', { replace: true })
      return
    }

    const timer = window.setTimeout(() => {
      const next = consumePostAuthDestination() || dest
      navigate(next, { replace: true })
    }, POST_AUTH_LOADING_MS)

    return () => window.clearTimeout(timer)
  }, [navigate])

  return <LoadingScreen label="جاري تسجيل الدخول..." />
}
