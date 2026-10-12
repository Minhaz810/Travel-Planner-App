import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import Icon from '../components/Icon'
import { LANGUAGE_OPTIONS, TRAVEL_STYLE_OPTIONS } from '../constants'
import { displayName, initials } from '../utils'

export default function Profile() {
  const { user, updateMe, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: user.first_name, last_name: user.last_name })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | saving | saved

  const isDirty = form.first_name !== user.first_name || form.last_name !== user.last_name

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setStatus('idle')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setStatus('saving')
    try {
      const me = await updateMe({ first_name: form.first_name.trim(), last_name: form.last_name.trim() })
      setForm({ first_name: me.first_name, last_name: me.last_name })
      setStatus('saved')
    } catch (err) {
      setErrors(err.status === 400 ? err.data : { general: err.message })
      setStatus('idle')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <section className="section profile">
      <div className="container container--narrow">
        <div className="profile__banner">
          <div className="avatar avatar--xl">{initials(user)}</div>
          <div className="profile__identity">
            <h1>{displayName(user)}</h1>
            <p>
              @{user.username}
              {user.is_staff && <span className="badge">Staff</span>}
            </p>
          </div>
          <button type="button" className="btn btn--outline profile__logout" onClick={handleLogout}>
            <Icon name="logout" size={16} />
            Log out
          </button>
        </div>

        <div className="profile__grid">
          <div className="profile__main">
            <article className="card">
              <header className="card__head">
                <h2>Personal details</h2>
                <p>This is how your name appears across the app.</p>
              </header>
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
                    error={errors.first_name?.[0]}
                  />
                  <FormField
                    label="Last name"
                    name="last_name"
                    autoComplete="family-name"
                    value={form.last_name}
                    onChange={update}
                    error={errors.last_name?.[0]}
                  />
                </div>
                <div className="form__actions">
                  {status === 'saved' && (
                    <span className="saved-note" role="status">
                      <Icon name="check" size={16} />
                      Saved
                    </span>
                  )}
                  <button type="submit" className="btn btn--primary" disabled={!isDirty || status === 'saving'}>
                    {status === 'saving' ? <span className="spinner spinner--light" /> : 'Save changes'}
                  </button>
                </div>
              </form>
            </article>

            <PreferencesForm />
          </div>

          <div className="profile__side">
            <article className="card">
              <header className="card__head">
                <h2>Account</h2>
              </header>
              <ul className="info-list">
                <li>
                  <Icon name="user" size={18} />
                  <div>
                    <span>Username</span>
                    <strong>{user.username}</strong>
                  </div>
                </li>
                <li>
                  <Icon name="mail" size={18} />
                  <div>
                    <span>Email</span>
                    <strong>{user.email || '—'}</strong>
                  </div>
                </li>
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

// Travel style options plus a way to clear it. '' is sent to the API as null.
const STYLE_CHOICES = [{ value: '', label: 'Not set' }, ...TRAVEL_STYLE_OPTIONS]

function PreferencesForm() {
  const { user, updateProfile } = useAuth()
  const saved = {
    preferred_language: user.profile?.preferred_language || 'en',
    travel_style: user.profile?.travel_style || '',
  }
  const [form, setForm] = useState(saved)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | saving | saved

  const isDirty =
    form.preferred_language !== saved.preferred_language || form.travel_style !== saved.travel_style

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setStatus('idle')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setStatus('saving')
    try {
      const profile = await updateProfile({
        preferred_language: form.preferred_language,
        travel_style: form.travel_style || null,
      })
      setForm({ preferred_language: profile.preferred_language, travel_style: profile.travel_style || '' })
      setStatus('saved')
    } catch (err) {
      setErrors(err.status === 400 ? err.data : { general: err.message })
      setStatus('idle')
    }
  }

  const renderOptions = (name, options) =>
    options.map((opt) => (
      <label key={opt.value} className={form[name] === opt.value ? 'is-active' : ''}>
        <input type="radio" name={name} value={opt.value} checked={form[name] === opt.value} onChange={update} />
        {opt.label}
      </label>
    ))

  return (
    <article className="card">
      <header className="card__head">
        <h2>Travel preferences</h2>
        <p>Used to tailor the app language and trip suggestions.</p>
      </header>
      <form className="form" onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <div className="alert alert--error" role="alert">
            <Icon name="alert" size={18} />
            {errors.general}
          </div>
        )}
        <fieldset className={`segmented${errors.preferred_language ? ' field--error' : ''}`}>
          <legend>Preferred language</legend>
          <div className="segmented__options">{renderOptions('preferred_language', LANGUAGE_OPTIONS)}</div>
          {errors.preferred_language && <p className="field__error">{errors.preferred_language[0]}</p>}
        </fieldset>
        <fieldset className={`segmented${errors.travel_style ? ' field--error' : ''}`}>
          <legend>Travel style</legend>
          <div className="segmented__options segmented__options--auto">
            {renderOptions('travel_style', STYLE_CHOICES)}
          </div>
          {errors.travel_style && <p className="field__error">{errors.travel_style[0]}</p>}
        </fieldset>
        <div className="form__actions">
          {status === 'saved' && (
            <span className="saved-note" role="status">
              <Icon name="check" size={16} />
              Saved
            </span>
          )}
          <button type="submit" className="btn btn--primary" disabled={!isDirty || status === 'saving'}>
            {status === 'saving' ? <span className="spinner spinner--light" /> : 'Save preferences'}
          </button>
        </div>
      </form>
    </article>
  )
}
