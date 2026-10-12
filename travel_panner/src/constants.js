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

export const TRAVEL_STYLE_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'luxury', label: 'Luxury' },
]

export const CATEGORY_OPTIONS = [
  { value: 'beach', label: 'Beach' },
  { value: 'hill', label: 'Hill' },
  { value: 'forest', label: 'Forest' },
  { value: 'heritage', label: 'Heritage' },
  { value: 'river', label: 'River' },
  { value: 'religious', label: 'Religious' },
  { value: 'city', label: 'City' },
]

export const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]))

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const STAY_TYPE_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
]

export const STAY_TYPE_LABELS = Object.fromEntries(STAY_TYPE_OPTIONS.map((o) => [o.value, o.label]))

export const TRANSPORT_MODE_LABELS = {
  car: 'Car',
  train: 'Train',
  launch: 'Launch',
  other: 'Bus / other',
}

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'transport', label: 'Transport', icon: 'route' },
  { value: 'stay', label: 'Stay', icon: 'bed' },
  { value: 'food', label: 'Food', icon: 'utensils' },
  { value: 'tickets', label: 'Tickets', icon: 'ticket' },
  { value: 'shopping', label: 'Shopping', icon: 'tag' },
  { value: 'other', label: 'Other', icon: 'wallet' },
]

export const EXPENSE_CATEGORIES = Object.fromEntries(EXPENSE_CATEGORY_OPTIONS.map((o) => [o.value, o]))

export const APP_NAME = 'Travel Planner'
