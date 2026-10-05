/**
 * Temporary frontend-only OTP until a verification API exists.
 * Replace `isMockOtpValid` with a real API call when the backend is ready.
 */
export const MOCK_OTP_CODE = '111111'
export const MOCK_OTP_LENGTH = 6

export function isMockOtpValid(code: string) {
  return code === MOCK_OTP_CODE
}
