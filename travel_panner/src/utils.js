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

// "3000.00" -> "৳3,000"
export function formatBdt(value) {
  if (value === null || value === undefined) return null
  return `৳${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
