import Icon from './Icon'

// Two-column shell shared by the login and register pages.
export default function AuthLayout({ title, subtitle, image, imageCaption, children }) {
  return (
    <section className="auth">
      <div className="auth__panel">
        <div className="auth__card">
          <header className="auth__header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          {children}
        </div>
      </div>
      <aside className="auth__visual" style={{ backgroundImage: `url(${image})` }}>
        <div className="auth__visual-text">
          <span className="eyebrow eyebrow--glass">
            <Icon name="mapPin" size={14} />
            {imageCaption.place}
          </span>
          <p>{imageCaption.quote}</p>
          <small>{imageCaption.credit}</small>
        </div>
      </aside>
    </section>
  )
}
