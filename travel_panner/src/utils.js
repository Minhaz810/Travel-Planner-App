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
