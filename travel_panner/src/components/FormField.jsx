import { useId, useState } from 'react'
import Icon from './Icon'

export default function FormField({ label, error, type = 'text', hint, ...inputProps }) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field__control">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  )
}
