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

// ── Email template ────────────────────────────────────────────────────────────
// Table-based with inline styles so it renders the same in Gmail, Outlook and phone apps.

const FONT = "Tahoma,'Segoe UI',Arial,sans-serif"

/** Keeps "Track+" reading left to right inside Arabic text, so the + stays after the name. */
const brand = (html) => html.replace(/Track\+/g, '<span dir="ltr" style="unicode-bidi:isolate">Track+</span>')

function layout(title, body, { preheader = '' } = {}) {
  const logo = `${appUrl()}/email/logo.png`
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f2f4f3">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f3;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e8eb">
<tr><td style="height:6px;background:linear-gradient(90deg,#21aa7c,#67bf64);background-color:#21aa7c;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td align="center" style="padding:28px 32px 8px"><img src="${escapeHtml(logo)}" width="129" height="42" alt="Track+" style="display:block;border:0;width:129px;height:42px"></td></tr>
<tr><td dir="rtl" style="padding:16px 32px 32px;font-family:${FONT};color:#0c0c0d;text-align:right;font-size:15px;line-height:26px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:32px;font-weight:700;color:#0c0c0d">${brand(escapeHtml(title))}</h1>
${brand(body)}
</td></tr>
<tr><td dir="rtl" style="padding:18px 32px;background:#fafafa;border-top:1px solid #f0f0f2;font-family:${FONT};font-size:12px;line-height:20px;color:#8e8f97;text-align:center">
هذه رسالة آلية من منصة ${brand('Track+')} لإدارة المشاريع، لا ترد عليها.<br>إذا لم تكن تتوقع هذه الرسالة يمكنك تجاهلها.
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

function button(url, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:10px;background:#21aa7c">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 32px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(label)}</a>
</td></tr></table>`
}

function details(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;background:#f6f8f7;border:1px solid #e3ece6;border-radius:12px">
${rows
  .map(
    ([label, value], index) => `<tr><td style="padding:14px 18px;${index ? 'border-top:1px solid #e3ece6;' : ''}font-family:${FONT}">
<div style="font-size:12px;line-height:18px;color:#8e8f97">${escapeHtml(label)}</div>
<div dir="ltr" style="font-family:Menlo,Consolas,monospace;font-size:16px;line-height:24px;font-weight:700;color:#0c0c0d;text-align:right">${escapeHtml(value)}</div>
</td></tr>`,
  )
  .join('')}
</table>`
}

function notice(text) {
  return `<p style="margin:0;padding:12px 16px;border-radius:10px;background:#fffaeb;border:1px solid #fde9ce;color:#93540b;font-size:13px;line-height:22px">${escapeHtml(text)}</p>`
}

function fallbackLink(url) {
  return `<p style="margin:16px 0 0;font-size:12px;line-height:20px;color:#8e8f97">إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:<br><a href="${escapeHtml(url)}" dir="ltr" style="color:#21aa7c;word-break:break-all">${escapeHtml(url)}</a></p>`
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
  // Opens the sign-in page with the invited address already filled in.
  const url = `${appUrl()}/login?invite=1&email=${encodeURIComponent(email)}`
  return sendMail({
    to: email,
    subject: 'دعوة للانضمام إلى Track+',
    text: `مرحباً ${name}،\n\nتمت دعوتك إلى Track+.\nالبريد الإلكتروني: ${email}\nكلمة المرور المؤقتة: ${temporaryPassword}\nرابط الدخول: ${url}\n\nيجب تغيير كلمة المرور المؤقتة عند أول تسجيل دخول.`,
    html: layout(
      'مرحباً بك في Track+',
      `<p style="margin:0 0 8px">مرحباً ${escapeHtml(name)}،</p>
<p style="margin:0 0 16px">تمت دعوتك للانضمام إلى منصة Track+ لمتابعة المشاريع والأهداف الاستراتيجية. هذه بيانات الدخول الخاصة بك:</p>
${details([
  ['البريد الإلكتروني', email],
  ['كلمة المرور المؤقتة', temporaryPassword],
])}
${button(url, 'ابدأ وسجّل دخولك الآن')}
${notice('ستُطلب منك كلمة مرور جديدة عند أول تسجيل دخول، ولن تعمل كلمة المرور المؤقتة بعد تغييرها.')}
${fallbackLink(url)}`,
      { preheader: 'بيانات الدخول إلى Track+ وكلمة المرور المؤقتة' },
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
      `<p style="margin:0 0 16px">استخدم هذا الرمز لإكمال تسجيل الدخول:</p>
<p dir="ltr" style="margin:0 0 16px;padding:18px;border-radius:12px;background:#f6f8f7;border:1px solid #e3ece6;text-align:center;font-family:Menlo,Consolas,monospace;font-size:32px;line-height:40px;font-weight:700;letter-spacing:8px;color:#0c0c0d">${escapeHtml(code)}</p>
${notice('الرمز صالح لمدة 5 دقائق. لا تشاركه مع أي أحد.')}`,
      { preheader: `رمز الدخول ${code}` },
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
      `<p style="margin:0">وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. اضغط الزر لاختيار كلمة مرور جديدة:</p>
${button(url, 'إعادة تعيين كلمة المرور')}
${notice('الرابط صالح لمدة ساعة واحدة. إذا لم تطلب ذلك فتجاهل هذه الرسالة وستبقى كلمة المرور كما هي.')}
${fallbackLink(url)}`,
      { preheader: 'رابط إعادة تعيين كلمة المرور' },
    ),
  })
}

module.exports = {
  isMailConfigured,
  sendInviteEmail,
  sendLoginCodeEmail,
  sendPasswordResetEmail,
}
