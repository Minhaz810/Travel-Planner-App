import { useState } from 'react'
import FormField from './FormField'
import Icon from './Icon'

// Shared by "New trip" and "Edit trip". `onSubmit` receives the API payload and should return a promise.
export default function TripForm({ initial = {}, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    start_date: initial.start_date || '',
    content: initial.content || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await onSubmit({ title: form.title.trim(), start_date: form.start_date || null, content: form.content })
    } catch (err) {
      setErrors(err.status === 400 ? err.data : { general: err.message })
      setSaving(false)
    }
  }

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      {errors.general && (
        <div className="alert alert--error" role="alert">
          <Icon name="alert" size={18} />
          {errors.general}
        </div>
      )}
      <div className="form__row">
        <FormField
          label="Title"
          name="title"
          value={form.title}
          onChange={update}
          maxLength={150}
          placeholder="e.g. Sylhet with family"
          error={errors.title?.[0]}
        />
        <FormField
          label="Start date (optional)"
          name="start_date"
          type="date"
          value={form.start_date}
          onChange={update}
          error={errors.start_date?.[0]}
        />
      </div>
      <label className={`field${errors.content ? ' field--error' : ''}`}>
        <span className="field__label">Plan</span>
        <textarea
          name="content"
          value={form.content}
          onChange={update}
          rows={16}
          placeholder={'## Day 1\n- Morning: ...\n- Afternoon: ...\n\n## Costs\n- Hotel: ৳3,000'}
        />
        {errors.content && <span className="field__error">{errors.content[0]}</span>}
        <span className="field__hint">Markdown is supported: ## headings, - bullet points, **bold**.</span>
      </label>
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving || !form.title.trim() || !form.content.trim()}>
          {saving ? <span className="spinner spinner--light" /> : submitLabel}
        </button>
      </div>
    </form>
  )
}
