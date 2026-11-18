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
// Built from the approved Figma design ("Executive"): a white letter with a dark green
// top bar, the Track+ logo and date, a short label and headline, a details table, one
// full-width dark green button, and a dark green footer. Mail-client friendly: 600px
// tables, inline styles, IBM Plex Sans Arabic with system fallbacks, a hidden preheader
// and a plain-text version alongside.

const FONT = "'IBM Plex Sans Arabic',Tahoma,'Segoe UI',Arial,sans-serif"
const LATIN = "'Inter','Segoe UI',Arial,sans-serif"
const DARK = '#183826'
const GREEN = '#2e8b57'
const PLUS = '#50b055'
const INK = '#18181b'
const BODY = '#52525b'
const MUTED = '#6b7280'
const FAINT = '#9ca3af'
const LINE = '#e7e8eb'
const ROW_LINE = '#eef0ee'

/** Keeps "Track+" reading left to right inside Arabic text, so the + stays after the name. */
const brand = (html) => html.replace(/Track\+/g, '<span dir="ltr" style="unicode-bidi:isolate">Track+</span>')

function today() {
  try {
    return new Date().toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/** The track+ By JODAYN logo: the coloured mark image with the wordmark as live text. */
function logo({ light = false, small = false } = {}) {
  const mark = `${appUrl()}/email/mark.png`
  const word = light ? '#ffffff' : INK
  return `<table role="presentation" dir="ltr" align="left" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle"><img src="${escapeHtml(mark)}" width="${small ? 24 : 30}" height="${small ? 23 : 29}" alt="Track+" style="display:block;border:0"></td>
<td style="padding-left:7px;vertical-align:middle;font-family:${LATIN};line-height:1">
<div style="font-size:${small ? 17 : 21}px;font-weight:800;color:${word};letter-spacing:-0.4px">track<span style="color:${PLUS}">+</span></div>
<div style="margin-top:2px;font-size:${small ? 7 : 8}px;font-weight:700;color:${word};text-align:right">By JODAYN</div>
</td></tr></table>`
}

function layout({ label, title, intro = '', body, preheader = '' }) {
  const site = appUrl()
  const support = process.env.MAIL_FROM || process.env.SMTP_USER || ''
  const supportEmail = (support.match(/<([^>]+)>/) || [null, support])[1]
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{color-scheme:light only;supported-color-schemes:light}
@media only screen and (max-width:520px){
.tp-pad{padding-left:24px!important;padding-right:24px!important}
.tp-outer{padding:16px 8px!important}
.tp-h1{font-size:24px!important;line-height:36px!important}
.tp-label{font-size:17px!important}
.tp-body{padding-top:28px!important;padding-bottom:32px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:#f2f2f0;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0">
<tr><td class="tp-outer" align="center" style="padding:32px 12px">
<table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden">

<tr><td bgcolor="${DARK}" style="height:8px;background:${DARK};font-size:0;line-height:0">&nbsp;</td></tr>

<tr><td class="tp-pad" style="padding:28px 48px 0">
<table role="presentation" dir="ltr" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" align="left" style="vertical-align:middle;text-align:left"><a href="${escapeHtml(site)}" style="text-decoration:none">${logo()}</a></td>
<td width="50%" align="right" dir="rtl" style="font-family:${FONT};font-size:12px;line-height:19px;color:${FAINT};vertical-align:middle;text-align:right;white-space:nowrap">${escapeHtml(today())}</td>
</tr></table>
</td></tr>

<tr><td class="tp-pad tp-body" dir="rtl" style="padding:40px 48px 44px;font-family:${FONT};text-align:right;color:${INK}">
<p class="tp-label" style="margin:0 0 16px;font-size:20px;line-height:28px;font-weight:400;color:${GREEN}">${brand(escapeHtml(label))}</p>
<h1 class="tp-h1" style="margin:0;font-size:30px;line-height:44px;font-weight:400;color:${INK};white-space:pre-line">${brand(escapeHtml(title))}</h1>
${intro ? `<p style="margin:20px 0 0;font-size:15px;line-height:27px;color:${BODY}">${brand(escapeHtml(intro))}</p>` : ''}
${brand(body)}
<p style="margin:28px 0 0;font-size:14px;line-height:22px;color:${BODY}">مع التحية،</p>
</td></tr>

<tr><td class="tp-pad" bgcolor="${DARK}" style="background:${DARK};padding:20px 48px">
<table role="presentation" dir="ltr" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="40%" align="left" style="vertical-align:middle;text-align:left">${logo({ light: true, small: true })}</td>
<td width="60%" align="right" dir="rtl" style="font-family:${FONT};font-size:12px;line-height:19px;color:#a7b8ad;vertical-align:middle;text-align:right;white-space:nowrap">
${supportEmail ? `<a href="mailto:${escapeHtml(supportEmail)}" style="color:#a7b8ad;text-decoration:none">الدعم</a> · ` : ''}<a href="${escapeHtml(site)}" style="color:#a7b8ad;text-decoration:none">زيارة الموقع</a>
</td>
</tr></table>
</td></tr>

</table>
<p dir="rtl" style="margin:16px 0 0;font-family:${FONT};font-size:11px;line-height:18px;color:${FAINT};text-align:center">رسالة آلية من منصة ${brand('Track+')}، يرجى عدم الرد عليها. إذا لم تكن تتوقعها يمكنك تجاهلها.</p>
</td></tr>
</table>
</body></html>`
}

/** Shows an address or code as plain dark text, so mail apps do not restyle it as a blue link. */
function plainValue(value) {
  const safe = escapeHtml(value).replace(/@/g, '<span>@</span>').replace(/\./g, '<span>.</span>')
  return `<span style="color:${INK};text-decoration:none">${safe}</span>`
}

function divider(top = 24) {
  return `<div style="margin-top:${top}px;height:1px;background:${LINE};font-size:0;line-height:0">&nbsp;</div>`
}

/** Label on the right, value on the left, as in the design's details table. */
function details(rows) {
  return `${divider()}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
${rows
  .map(
    ([label, value], index) => `<tr>
<td width="38%" align="right" style="padding:14px 0 14px 8px;${index ? `border-top:1px solid ${ROW_LINE};` : ''}font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED}">${escapeHtml(label)}</td>
<td width="62%" align="left" dir="ltr" style="padding:14px 0;${index ? `border-top:1px solid ${ROW_LINE};` : ''}font-family:${LATIN};font-size:14px;line-height:22px;font-weight:400;color:${INK};word-break:normal;overflow-wrap:anywhere">${plainValue(value)}</td>
</tr>`,
  )
  .join('')}
</table>
${divider(8)}`
}

/** Full-width dark green pill, like the design's main button. */
function button(url, label) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr>
<td align="center" bgcolor="${DARK}" style="border-radius:999px;background:${DARK}">
<a href="${escapeHtml(url)}" style="display:block;padding:16px 24px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:400;color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(label)}</a>
</td></tr></table>`
}

function note(text) {
  return `<p style="margin:16px 0 0;font-family:${FONT};font-size:13px;line-height:21px;color:${MUTED}">${escapeHtml(text)}</p>`
}

/** The sign-in code as large digits in a row of boxes. */
function codeBoxes(code) {
  const cells = String(code)
    .split('')
    .map(
      (digit) => `<td style="padding:0 4px"><div style="width:48px;height:58px;border:1px solid ${LINE};border-radius:12px;background:#fafafa;font-family:${LATIN};font-size:28px;line-height:58px;font-weight:400;text-align:center;color:${INK}">${escapeHtml(digit)}</div></td>`,
    )
    .join('')
  return `${divider()}<table role="presentation" align="center" dir="ltr" cellpadding="0" cellspacing="0" style="margin:24px auto 0"><tr>${cells}</tr></table>`
}

function fallbackLink(url) {
  return `<p style="margin:12px 0 0;font-family:${FONT};font-size:12px;line-height:20px;color:${FAINT}">إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:<br><a href="${escapeHtml(url)}" dir="ltr" style="color:${GREEN};word-break:break-all">${escapeHtml(url)}</a></p>`
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
    html: layout({
      label: 'دعوة للانضمام',
      title: `مرحباً ${name}،\nحسابك جاهز للبدء.`,
      intro: 'تمت دعوتك لمتابعة المشاريع والمخرجات والأهداف الاستراتيجية مع فريقك. استخدم البيانات التالية لتسجيل دخولك الأول.',
      preheader: 'بيانات الدخول إلى Track+ وكلمة المرور المؤقتة',
      body: `${details([
  ['البريد الإلكتروني', email],
  ['كلمة المرور المؤقتة', temporaryPassword],
])}
${button(url, 'سجّل دخولك الآن')}
${note('ستُطلب منك كلمة مرور جديدة عند أول دخول، ولن تعمل كلمة المرور المؤقتة بعدها.')}
${fallbackLink(url)}`,
    }),
  })
}

function sendLoginCodeEmail({ email, code }) {
  return sendMail({
    to: email,
    subject: 'رمز الدخول إلى Track+',
    text: `رمز الدخول: ${code}\nالرمز صالح لمدة 5 دقائق.`,
    html: layout({
      label: 'رمز الدخول',
      title: 'رمز تسجيل الدخول\nإلى حسابك في Track+',
      intro: 'استخدم هذا الرمز لإكمال تسجيل دخولك. الرمز صالح لمدة 5 دقائق.',
      preheader: `رمز الدخول ${code}`,
      body: `${codeBoxes(code)}
${note('لن يطلب منك فريق Track+ هذا الرمز أبدًا، فلا تشاركه مع أي أحد. إذا لم تحاول تسجيل الدخول فتجاهل هذه الرسالة.')}`,
    }),
  })
}

function sendPasswordResetEmail({ email, token }) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`
  return sendMail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور في Track+',
    text: `لإعادة تعيين كلمة المرور افتح هذا الرابط خلال ساعة:\n${url}`,
    html: layout({
      label: 'أمان الحساب',
      title: 'إعادة تعيين\nكلمة المرور',
      intro: 'وصلنا طلب لتغيير كلمة المرور لحسابك في Track+. اضغط الزر لاختيار كلمة مرور جديدة. الرابط صالح لمدة ساعة واحدة.',
      preheader: 'رابط إعادة تعيين كلمة المرور',
      body: `${divider()}
${button(url, 'اختر كلمة مرور جديدة')}
${note('إذا لم تطلب ذلك فتجاهل هذه الرسالة، وستبقى كلمة المرور الحالية كما هي.')}
${fallbackLink(url)}`,
    }),
  })
}

module.exports = {
  isMailConfigured,
  sendInviteEmail,
  sendLoginCodeEmail,
  sendPasswordResetEmail,
}
