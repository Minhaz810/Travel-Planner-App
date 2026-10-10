import { useAuth } from '../auth/AuthContext'

// The signed-in user's preferred content language ('en' or 'bn'). Guests get English.
export default function useLanguage() {
  const { user } = useAuth()
  return user?.profile?.preferred_language || 'en'
}
