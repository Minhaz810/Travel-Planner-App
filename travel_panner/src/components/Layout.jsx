import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { APP_NAME } from '../constants'
import { initials } from '../utils'
import Icon from './Icon'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand__mark">
            <Icon name="compass" size={20} />
          </span>
          {APP_NAME}
        </Link>

        <button
          type="button"
          className="navbar__burger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>

        <nav className={`navbar__links${menuOpen ? ' is-open' : ''}`} onClick={() => setMenuOpen(false)}>
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>
          <NavLink to="/destinations" className="nav-link">
            Destinations
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/profile" className="nav-link nav-link--user">
                <span className="avatar avatar--sm">{initials(user)}</span>
                {user.first_name || user.username}
              </NavLink>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                <Icon name="logout" size={16} />
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Log in
              </NavLink>
              <Link to="/register" className="btn btn--primary btn--sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer__inner">
          <span>© {new Date().getFullYear()} {APP_NAME} · Explore Bangladesh</span>
          <span className="footer__muted">Photos from Wikimedia Commons</span>
        </div>
      </footer>
    </div>
  )
}
