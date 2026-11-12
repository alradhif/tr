/**
 * Arabic text normalization so that questions match names and keywords regardless of
 * hamza forms, taa marbuta, diacritics, tatweel or Arabic-Indic digits.
 */
const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(DIACRITICS, '')
    .replace(/ـ/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[^\p{L}\p{N}\s%-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Words that say nothing about which record is meant. */
const STOPWORDS = new Set(
  normalize(
    'ال في من على عن الى إلى مع و او أو ما ماذا وش ايش شو كم هل هو هي هذا هذه ذلك تلك اللي الذي التي ' +
      'عندي عندنا لدي لدينا ابي ابغى اريد ممكن لو سمحت تكفى اعطني عطني وريني اعرض اظهر قول قل لي لنا ' +
      'مشروع المشروع مشاريع المشاريع هدف الهدف اهداف الاهداف شركه الشركه اداره الاداره تفاصيل معلومات عن حاله وضع',
  ).split(' '),
)

/** Strips the Arabic definite article and common attached prefixes from one word. */
function stem(word) {
  let w = word
  for (const prefix of ['وال', 'بال', 'كال', 'فال', 'لل', 'ال']) {
    if (w.startsWith(prefix) && w.length - prefix.length >= 2) {
      w = w.slice(prefix.length)
      break
    }
  }
  return w
}

function tokens(text) {
  return normalize(text)
    .split(' ')
    .filter(Boolean)
    .map(stem)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
}

module.exports = { normalize, tokens, stem }
