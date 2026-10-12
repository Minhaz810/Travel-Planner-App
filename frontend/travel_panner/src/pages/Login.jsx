import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import Icon from '../components/Icon'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form.username.trim(), form.password)
      navigate(location.state?.from || '/profile', { replace: true })
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect username or password.' : err.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue planning your trips."
      image="/images/sajek-valley-1.jpg"
      imageCaption={{
        place: 'Sajek Valley, Rangamati',
        quote: 'Wake up above the clouds.',
        credit: 'Photo: Biplobkgc / CC BY-SA 3.0',
      }}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert--error" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </div>
        )}
        <FormField
          label="Username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={update}
          required
          autoFocus
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update}
          required
        />
        <button
          type="submit"
          className="btn btn--primary btn--block btn--lg"
          disabled={submitting || !form.username || !form.password}
        >
          {submitting ? <span className="spinner spinner--light" /> : 'Log in'}
        </button>
      </form>
      <p className="auth__switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
