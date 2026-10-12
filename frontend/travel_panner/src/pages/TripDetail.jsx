import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { plannerApi } from '../api'
import BudgetTracker from '../components/BudgetTracker'
import Icon from '../components/Icon'
import Markdown from '../components/Markdown'
import TripForm from '../components/TripForm'
import useApi from '../hooks/useApi'
import { formatDate } from '../utils'

export default function TripDetail() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { data: trip, error, loading, setData } = useApi(plannerApi.tripPath(tripId))
  const [editing, setEditing] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleDelete = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    try {
      await plannerApi.deleteTrip(trip.id)
      navigate('/trips')
    } catch (err) {
      setDeleteError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="page-loader" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    )
  }

  return (
    <section className="section trip">
      <div className="container container--narrow">
        <Link to="/trips" className="back-link">
          <Icon name="arrowLeft" size={16} />
          My trips
        </Link>

        {error &&
          (error.status === 404 ? (
            <div className="empty-state trip__missing">
              <Icon name="bookmark" size={28} />
              <h3>Trip not found</h3>
              <p>It may have been deleted.</p>
            </div>
          ) : (
            <div className="alert alert--error" role="alert">
              <Icon name="alert" size={18} />
              {error.message}
            </div>
          ))}

        {trip && (
          <>
            <header className="trip__head">
              <div>
                <h1>{trip.title}</h1>
                <p className="trip-card__meta">
                  <Icon name="calendar" size={15} />
                  {trip.start_date ? `Starts ${formatDate(trip.start_date)}` : 'No start date'}
                  <span className="muted">· Saved {formatDate(trip.created_at)}</span>
                </p>
              </div>
              {!editing && (
                <div className="trip__actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(true)}>
                    <Icon name="pencil" size={16} />
                    Edit
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={handleDelete}>
                    <Icon name="trash" size={16} />
                    Delete
                  </button>
                </div>
              )}
            </header>

            {deleteError && (
              <div className="alert alert--error" role="alert">
                <Icon name="alert" size={18} />
                {deleteError}
              </div>
            )}

            {editing ? (
              <TripForm
                initial={trip}
                submitLabel="Save changes"
                onCancel={() => setEditing(false)}
                onSubmit={async (payload) => {
                  setData(await plannerApi.updateTrip(trip.id, payload))
                  setEditing(false)
                }}
              />
            ) : (
              <article className="card">
                <Markdown>{trip.content}</Markdown>
              </article>
            )}

            <BudgetTracker key={trip.id} tripId={trip.id} initialBudget={trip.budget} />
          </>
        )}
      </div>
    </section>
  )
}
