export function displayName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
}

export function initials(user) {
  return displayName(user)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Picks `field_bn` or `field_en` for the given language, falling back to English.
export function localized(obj, field, lang) {
  return obj[`${field}_${lang}`] || obj[`${field}_en`]
}

// "3000.00" -> "৳3,000", "450.50" -> "৳450.5", "-500.00" -> "-৳500"
export function formatBdt(value) {
  if (value === null || value === undefined) return null
  const number = Number(value)
  const formatted = Math.abs(number).toLocaleString('en-IN', { maximumFractionDigits: 2 })
  return `${number < 0 ? '-' : ''}৳${formatted}`
}

// Today's date as YYYY-MM-DD in the user's time zone.
export function todayIso() {
  return new Date().toLocaleDateString('en-CA')
}

// "2026-11-14" -> "14 Nov 2026". Date-only strings are read as local dates, not UTC.
export function formatDate(value) {
  if (!value) return null
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
