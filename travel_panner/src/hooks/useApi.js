import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

// Loads `path` with GET and reloads whenever it changes. Pass `null` to skip loading.
// `loading` is derived from which path the stored result belongs to, so the effect never sets state synchronously.
export default function useApi(path) {
  const [result, setResult] = useState({ path: null, data: null, error: null })

  useEffect(() => {
    if (!path) return
    let active = true
    apiFetch(path, { auth: true })
      .then((data) => active && setResult({ path, data, error: null }))
      .catch((error) => active && setResult({ path, data: null, error }))
    return () => {
      active = false
    }
  }, [path])

  const current = result.path === path
  return {
    data: current ? result.data : null,
    error: current ? result.error : null,
    loading: Boolean(path) && !current,
  }
}
