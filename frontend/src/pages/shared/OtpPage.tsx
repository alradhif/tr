import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { resendLoginCode, verifyLoginCode } from '../../api/auth'
import { ApiError } from '../../api/client'
import { clearPendingLogin, commitSession, getPendingLogin, setPendingLogin } from '../../auth/pendingLogin'
import { beginPostAuthLoading } from '../../auth/postAuthLoading'
import { TwoFactor } from '../../super-admin-ui/components/auth/TwoFactor'

export function OtpPage() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(getPendingLogin)

  if (!pending) {
    return <Navigate to="/login" replace />
  }

  function backToLogin() {
    clearPendingLogin()
    navigate('/login', { replace: true })
  }

  return (
    <TwoFactor
      demoCode={pending.demoCode}
      resendSeconds={pending.resendAfterSeconds}
      onVerify={async (code) => {
        try {
          const session = await verifyLoginCode(pending.challengeId, code)
          const destination = commitSession(session.token, session.user)
          if (!destination) throw new Error('هذا الحساب غير مدعوم في النظام')
          beginPostAuthLoading(navigate, destination)
        } catch (err) {
          // Expired or locked challenges can't be retried; send the user back to the password step.
          if (err instanceof ApiError && err.status === 429) {
            clearPendingLogin()
          }
          throw err
        }
      }}
      onResend={async () => {
        const next = await resendLoginCode(pending.challengeId)
        const updated = { ...pending, ...next }
        setPendingLogin(updated)
        setPending(updated)
      }}
      onBack={backToLogin}
    />
  )
}
