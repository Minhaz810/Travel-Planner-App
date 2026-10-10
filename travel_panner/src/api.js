import { API_BASE_URL, STORAGE_KEYS } from './constants'

export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

export const tokenStore = {
  get access() {
    return localStorage.getItem(STORAGE_KEYS.access)
  },
  get refresh() {
    return localStorage.getItem(STORAGE_KEYS.refresh)
  },
  set({ access, refresh }) {
    localStorage.setItem(STORAGE_KEYS.access, access)
    if (refresh) localStorage.setItem(STORAGE_KEYS.refresh, refresh)
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.access)
    localStorage.removeItem(STORAGE_KEYS.refresh)
  },
}

// Picks a readable message out of DRF's error formats.
function firstMessage(data) {
  if (!data) return 'Something went wrong. Please try again.'
  if (typeof data.detail === 'string') return data.detail
  const first = Object.values(data)[0]
  if (Array.isArray(first)) return first[0]
  if (typeof first === 'string') return first
  return 'Something went wrong. Please try again.'
}

export class ApiError extends Error {
  constructor(status, data) {
    super(firstMessage(data))
    this.status = status
    this.data = data || {}
  }
}

// Concurrent 401s share one refresh request.
let refreshPromise = null

function refreshTokens() {
  const refresh = tokenStore.refresh
  if (!refresh) return Promise.resolve(false)

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        tokenStore.set(await res.json())
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function apiFetch(path, { method = 'GET', body, auth = false } = {}, retry = true) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { detail: 'Cannot reach the server. Check your connection.' })
  }

  if (res.status === 401 && auth && retry) {
    if (await refreshTokens()) return apiFetch(path, { method, body, auth }, false)
    tokenStore.clear()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const authApi = {
  register: (payload) => apiFetch('/auth/register/', { method: 'POST', body: payload }),
  login: (username, password) => apiFetch('/auth/login/', { method: 'POST', body: { username, password } }),
  logout: (refresh) => apiFetch('/auth/logout/', { method: 'POST', body: { refresh } }),
  getMe: () => apiFetch('/auth/me/', { auth: true }),
  updateMe: (changes) => apiFetch('/auth/me/', { method: 'PATCH', body: changes, auth: true }),
}
