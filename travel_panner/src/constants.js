// Single source of truth for the colour palette.
// Every key is exposed to CSS as a variable, e.g. `primaryHover` -> `var(--primary-hover)`.
export const COLORS = {
  // Brand
  primary: '#0B8A5F',
  primaryHover: '#08724E',
  primarySoft: '#E7F5EF',
  accent: '#F2643D',
  accentSoft: '#FEEFEA',

  // Surfaces (white theme)
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F6F8F7',
  border: '#E4E8E6',
  borderStrong: '#CBD3CF',

  // Text
  textPrimary: '#0F1F1A',
  textSecondary: '#4B5D57',
  textMuted: '#8A9A94',
  textOnPrimary: '#FFFFFF',

  // Feedback
  success: '#15803D',
  successSoft: '#ECFDF3',
  error: '#DC2626',
  errorSoft: '#FEF2F2',

  // Effects
  shadow: 'rgba(15, 31, 26, 0.08)',
  overlay: 'rgba(15, 31, 26, 0.55)',
}

export const API_BASE_URL = '/api'

export const STORAGE_KEYS = {
  access: 'tp_access',
  refresh: 'tp_refresh',
}

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা' },
]

export const TRAVEL_STYLE_LABELS = {
  budget: 'Budget',
  comfort: 'Comfort',
  luxury: 'Luxury',
}

export const APP_NAME = 'Travel Planner'
