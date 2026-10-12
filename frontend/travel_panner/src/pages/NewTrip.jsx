import { Link, useNavigate } from 'react-router-dom'
import { plannerApi } from '../api'
import Icon from '../components/Icon'
import TripForm from '../components/TripForm'

export default function NewTrip() {
  const navigate = useNavigate()

  const createTrip = async (payload) => {
    const trip = await plannerApi.createTrip(payload)
    navigate(`/trips/${trip.id}`, { replace: true })
  }

  return (
    <section className="section trip">
      <div className="container container--narrow">
        <Link to="/trips" className="back-link">
          <Icon name="arrowLeft" size={16} />
          My trips
        </Link>
        <header className="trip__head">
          <div>
            <h1>Write your own trip</h1>
            <p>
              Plan it your way. Need ideas?{' '}
              <Link to="/planner" target="_blank" rel="noopener">
                Ask the trip planner in a new tab
              </Link>{' '}
              and copy what you like.
            </p>
          </div>
        </header>
        <TripForm submitLabel="Create trip" onSubmit={createTrip} onCancel={() => navigate('/trips')} />
      </div>
    </section>
  )
}
