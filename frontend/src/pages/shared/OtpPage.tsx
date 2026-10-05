import { Navigate, useNavigate } from 'react-router-dom'
import { clearPendingLogin, commitPendingLogin, hasPendingLogin } from '../../auth/pendingLogin'
import { beginPostAuthLoading } from '../../auth/postAuthLoading'
import { TwoFactor } from '../../super-admin-ui/components/auth/TwoFactor'

export function OtpPage() {
  const navigate = useNavigate()

  if (!hasPendingLogin()) {
    return <Navigate to="/login" replace />
  }

  return (
    <TwoFactor
      onSuccess={() => {
        const destination = commitPendingLogin()
        if (!destination) {
          navigate('/login', { replace: true })
          return
        }
        beginPostAuthLoading(navigate, destination)
      }}
      onBack={() => {
        clearPendingLogin()
        navigate('/login', { replace: true })
      }}
    />
  )
}
