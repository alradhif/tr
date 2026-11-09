const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[0-9][0-9\s-]{6,19}$/

/** Returns an error message when a risk owner's phone or email is malformed. */
function riskContactError({ responsiblePhone, responsibleEmail }) {
  if (responsiblePhone && !PHONE.test(String(responsiblePhone).trim())) return 'رقم الهاتف غير صحيح'
  if (responsibleEmail && !EMAIL.test(String(responsibleEmail).trim())) return 'البريد الإلكتروني غير صحيح'
  return null
}

module.exports = { riskContactError }
