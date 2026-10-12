import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function FullPageSpinner() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="spinner" />
    </div>
  )
}

// Only signed-in users. Others are sent to /login and returned afterwards.
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

// Only signed-out users (login / register pages).
export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/profile" replace />
  return <Outlet />
}
