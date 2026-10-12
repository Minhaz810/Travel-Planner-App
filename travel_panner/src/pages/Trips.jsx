import { Link } from 'react-router-dom'
import { plannerApi } from '../api'
import Icon from '../components/Icon'
import useApi from '../hooks/useApi'
import { formatDate } from '../utils'

export default function Trips() {
  const { data: trips, error, loading } = useApi(plannerApi.tripsPath)

  return (
    <section className="section trips">
      <div className="container">
        <div className="section__head section__head--row">
          <div>
            <span className="eyebrow eyebrow--plain">My trips</span>
            <h2>Your saved trip plans</h2>
          </div>
          <div className="trips__actions">
            <Link to="/trips/new" className="btn btn--outline btn--sm">
              <Icon name="pencil" size={16} />
              Write my own trip
            </Link>
            <Link to="/planner" className="btn btn--primary btn--sm">
              <Icon name="sparkles" size={16} />
              Plan with AI
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert--error" role="alert">
            <Icon name="alert" size={18} />
            {error.message}
          </div>
        )}

        {loading && (
          <div className="page-loader page-loader--inline" role="status" aria-label="Loading">
            <span className="spinner" />
          </div>
        )}

        {trips?.length === 0 && (
          <div className="empty-state">
            <Icon name="bookmark" size={28} />
            <h3>No saved trips yet</h3>
            <p>Write your own plan, or ask the trip planner and press “Save as trip” on a reply you like.</p>
            <div className="trips__actions">
              <Link to="/trips/new" className="btn btn--outline btn--sm">
                Write my own trip
              </Link>
              <Link to="/planner" className="btn btn--primary btn--sm">
                Open the trip planner
              </Link>
            </div>
          </div>
        )}

        {trips?.length > 0 && (
          <div className="trip-grid">
            {trips.map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="card trip-card">
                <span className="feature__icon">
                  <Icon name="backpack" size={22} />
                </span>
                <h3>{trip.title}</h3>
                <p className="trip-card__meta">
                  <Icon name="calendar" size={15} />
                  {trip.start_date ? `Starts ${formatDate(trip.start_date)}` : 'No start date'}
                </p>
                <p className="muted">
                  Saved {formatDate(trip.created_at)}
                  {trip.has_budget && (
                    <span className="badge badge--soft">
                      <Icon name="wallet" size={12} /> Budget
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
