import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import Icon from '../components/Icon'
import { LANGUAGE_OPTIONS } from '../constants'

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  preferred_language: 'en',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: undefined })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match.' })
      return
    }

    setErrors({})
    setSubmitting(true)
    // eslint-disable-next-line no-unused-vars
    const { confirm_password, ...payload } = form
    try {
      await register({ ...payload, username: payload.username.trim(), email: payload.email.trim() })
      navigate('/profile', { replace: true })
    } catch (err) {
      // DRF returns { field: ["message"] } for validation errors.
      const fieldErrors = Object.fromEntries(
        Object.entries(err.data).map(([field, messages]) => [field, [].concat(messages).join(' ')]),
      )
      const hasFieldError = Object.keys(fieldErrors).some((f) => f in EMPTY_FORM)
      setErrors(hasFieldError ? fieldErrors : { general: err.message })
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save trips, track budgets and plan with the AI assistant."
      image="/images/coxs-bazar-beach-1.jpg"
      imageCaption={{
        place: "Cox's Bazar",
        quote: 'The longest natural sea beach in the world is waiting.',
        credit: 'Photo: Mehediabedin / CC BY-SA 4.0',
      }}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <div className="alert alert--error" role="alert">
            <Icon name="alert" size={18} />
            {errors.general}
          </div>
        )}
        <div className="form__row">
          <FormField
            label="First name"
            name="first_name"
            autoComplete="given-name"
            value={form.first_name}
            onChange={update}
            error={errors.first_name}
            autoFocus
          />
          <FormField
            label="Last name"
            name="last_name"
            autoComplete="family-name"
            value={form.last_name}
            onChange={update}
            error={errors.last_name}
          />
        </div>
        <FormField
          label="Username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={update}
          error={errors.username}
          hint="Letters, digits and @ . + - _ only. You'll use this to log in."
          required
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update}
          error={errors.email}
          required
        />
        <div className="form__row">
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update}
            error={errors.password}
            hint="At least 8 characters."
            required
          />
          <FormField
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={update}
            error={errors.confirm_password}
            required
          />
        </div>

        <fieldset className="segmented">
          <legend>Preferred language</legend>
          <div className="segmented__options">
            {LANGUAGE_OPTIONS.map((opt) => (
              <label key={opt.value} className={form.preferred_language === opt.value ? 'is-active' : ''}>
                <input
                  type="radio"
                  name="preferred_language"
                  value={opt.value}
                  checked={form.preferred_language === opt.value}
                  onChange={update}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="btn btn--primary btn--block btn--lg"
          disabled={submitting || !form.username || !form.email || !form.password}
        >
          {submitting ? <span className="spinner spinner--light" /> : 'Create account'}
        </button>
      </form>
      <p className="auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}
