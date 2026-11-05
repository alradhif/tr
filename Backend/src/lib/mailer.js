const nodemailer = require('nodemailer')

let transport = null

function isMailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // A login should not hang on a mail server that does not answer.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  }
  return transport
}

function appUrl() {
  const first = String(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0]
  return first.trim().replace(/\/+$/, '')
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function layout(title, body) {
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0c0c0d;text-align:right">
<h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h2>${body}
<p style="margin:24px 0 0;font-size:12px;color:#8e8f97">Track+</p></div>`
}

/**
 * Sends one email. Mail problems never fail the request that triggered them:
 * the caller gets false and falls back to its other way of delivering the secret.
 */
async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured()) return false
  try {
    await getTransport().sendMail({
      from: process.env.MAIL_FROM || `Track+ <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    })
    return true
  } catch (err) {
    console.error(`[mail] failed to send "${subject}": ${err.message}`)
    return false
  }
}

function sendInviteEmail({ name, email, temporaryPassword }) {
  const url = `${appUrl()}/login`
  return sendMail({
    to: email,
    subject: 'دعوة للانضمام إلى Track+',
    text: `مرحباً ${name}،\n\nتمت دعوتك إلى Track+.\nالبريد الإلكتروني: ${email}\nكلمة المرور المؤقتة: ${temporaryPassword}\nرابط الدخول: ${url}\n\nيجب تغيير كلمة المرور المؤقتة عند أول تسجيل دخول.`,
    html: layout(
      'دعوة للانضمام إلى Track+',
      `<p>مرحباً ${escapeHtml(name)}،</p><p>تمت دعوتك إلى Track+. هذه بيانات الدخول الخاصة بك:</p>
<p>البريد الإلكتروني: <b dir="ltr">${escapeHtml(email)}</b><br>كلمة المرور المؤقتة: <b dir="ltr">${escapeHtml(temporaryPassword)}</b></p>
<p><a href="${escapeHtml(url)}">تسجيل الدخول</a></p>
<p style="padding:10px 14px;border-radius:8px;background:#fde9ce;color:#93540b">يجب تغيير كلمة المرور المؤقتة عند أول تسجيل دخول.</p>`,
    ),
  })
}

function sendLoginCodeEmail({ email, code }) {
  return sendMail({
    to: email,
    subject: 'رمز الدخول إلى Track+',
    text: `رمز الدخول: ${code}\nالرمز صالح لمدة 5 دقائق.`,
    html: layout(
      'رمز الدخول إلى Track+',
      `<p style="font-size:28px;font-weight:700;letter-spacing:4px" dir="ltr">${escapeHtml(code)}</p><p>الرمز صالح لمدة 5 دقائق.</p>`,
    ),
  })
}

function sendPasswordResetEmail({ email, token }) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`
  return sendMail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور في Track+',
    text: `لإعادة تعيين كلمة المرور افتح هذا الرابط خلال ساعة:\n${url}`,
    html: layout(
      'إعادة تعيين كلمة المرور',
      `<p>لإعادة تعيين كلمة المرور افتح هذا الرابط خلال ساعة:</p><p><a href="${escapeHtml(url)}">إعادة تعيين كلمة المرور</a></p>`,
    ),
  })
}

module.exports = {
  isMailConfigured,
  sendInviteEmail,
  sendLoginCodeEmail,
  sendPasswordResetEmail,
}
