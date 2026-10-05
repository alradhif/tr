import type { NavigateFunction } from 'react-router-dom'

export const POST_AUTH_LOADING_MS = 3000
const DEST_KEY = 'trackplus.postAuthTo'

export function beginPostAuthLoading(navigate: NavigateFunction, destination: string) {
  sessionStorage.setItem(DEST_KEY, destination)
  navigate('/loading', { replace: true })
}

export function peekPostAuthDestination() {
  return sessionStorage.getItem(DEST_KEY)
}

export function consumePostAuthDestination() {
  const dest = sessionStorage.getItem(DEST_KEY)
  sessionStorage.removeItem(DEST_KEY)
  return dest
}
