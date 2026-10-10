import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi, SESSION_EXPIRED_EVENT, tokenStore } from '../api'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Only wait for /me/ when there is a stored session to restore.
  const [loading, setLoading] = useState(() => Boolean(tokenStore.access))

  useEffect(() => {
    if (!tokenStore.access) return
    authApi
      .getMe()
      .then(setUser)
      .catch(() => {
        tokenStore.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (username, password) => {
    const tokens = await authApi.login(username, password)
    tokenStore.set(tokens)
    const me = await authApi.getMe()
    setUser(me)
    return me
  }, [])

  const register = useCallback(async (payload) => {
    const { access, refresh, user: newUser } = await authApi.register(payload)
    tokenStore.set({ access, refresh })
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh
    tokenStore.clear()
    setUser(null)
    if (refresh) {
      // Best effort: the local session is already gone even if blacklisting fails.
      await authApi.logout(refresh).catch(() => {})
    }
  }, [])

  const updateMe = useCallback(async (changes) => {
    const me = await authApi.updateMe(changes)
    setUser(me)
    return me
  }, [])

  const updateProfile = useCallback(async (changes) => {
    const profile = await authApi.updateProfile(changes)
    setUser((prev) => ({ ...prev, profile }))
    return profile
  }, [])

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, logout, updateMe, updateProfile }),
    [user, loading, login, register, logout, updateMe, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
