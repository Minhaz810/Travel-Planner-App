import { Link } from 'react-router-dom'
import { destinationsApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import DestinationCard from '../components/DestinationCard'
import Icon from '../components/Icon'
import useApi from '../hooks/useApi'

const PHOTOS = [
  { src: '/images/sajek-valley-1.jpg', place: 'Sajek Valley', district: 'Rangamati', credit: 'Biplobkgc / CC BY-SA 3.0' },
  { src: '/images/coxs-bazar-beach-1.jpg', place: "Cox's Bazar", district: "Cox's Bazar", credit: 'Mehediabedin / CC BY-SA 4.0' },
  { src: '/images/ratargul-swamp-forest-1.jpg', place: 'Ratargul', district: 'Sylhet', credit: 'Tawkir.ahmad / CC BY-SA 4.0' },
  { src: '/images/sundarbans-1.jpg', place: 'Sundarbans', district: 'Khulna', credit: 'Shihabur Rahman / CC BY-SA 4.0' },
]

const FEATURES = [
  {
    icon: 'sparkles',
    title: 'AI travel assistant',
    text: 'Chat about where to go, what to pack and how to get there, in English or বাংলা.',
  },
  {
    icon: 'mapPin',
    title: 'Hand-picked destinations',
    text: 'Beaches, hills, forests and heritage sites across all 8 divisions, with season tips and costs.',
  },
  {
    icon: 'wallet',
    title: 'Trip budget tracker',
    text: 'Set a budget in BDT for each saved trip and log expenses by category as you travel.',
  },
]

const STATS = [
  { value: '8', label: 'Divisions' },
  { value: '64', label: 'Districts' },
  { value: '৳', label: 'Costs in BDT' },
]

export default function Home() {
  const { user, isAuthenticated } = useAuth()
  const featured = useApi(destinationsApi.list({ featured: 'true' }))

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">
              <Icon name="backpack" size={16} />
              Your Bangladesh travel companion
            </span>
            <h1>
              Plan your next escape, <span className="text-gradient">from hills to sea.</span>
            </h1>
            <p className="lead">
              Discover places worth the journey, plan trips with an AI assistant and keep every taka on track — all in
              one place.
            </p>

            <div className="hero__actions">
              {isAuthenticated ? (
                <>
                  <Link to="/planner" className="btn btn--primary btn--lg">
                    Plan a trip with AI
                    <Icon name="arrowRight" size={18} />
                  </Link>
                  <Link to="/trips" className="btn btn--outline btn--lg">
                    My trips, {user.first_name || user.username}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn--primary btn--lg">
                    Start planning free
                    <Icon name="arrowRight" size={18} />
                  </Link>
                  <Link to="/login" className="btn btn--outline btn--lg">
                    I have an account
                  </Link>
                </>
              )}
            </div>

            <dl className="stats">
              {STATS.map((s) => (
                <div key={s.label} className="stats__item">
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mosaic">
            {PHOTOS.map((p, i) => (
              <figure key={p.src} className={`mosaic__item mosaic__item--${i + 1}`}>
                <img src={p.src} alt={p.place} loading={i < 2 ? 'eager' : 'lazy'} />
                <figcaption>
                  <span className="mosaic__place">
                    <Icon name="mapPin" size={14} />
                    {p.place}
                  </span>
                  <span className="mosaic__credit">{p.credit}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {featured.data?.results.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <div className="section__head section__head--row">
              <div>
                <span className="eyebrow eyebrow--plain">Featured</span>
                <h2>Popular places to visit</h2>
              </div>
              <Link to="/destinations" className="btn btn--outline btn--sm">
                See all destinations
                <Icon name="arrowRight" size={16} />
              </Link>
            </div>
            <div className="dest-grid">
              {featured.data.results.slice(0, 6).map((d) => (
                <DestinationCard key={d.slug} destination={d} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow eyebrow--plain">What you get</span>
            <h2>Everything you need for the trip</h2>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <article key={f.title} className="card feature">
                <span className="feature__icon">
                  <Icon name={f.icon} size={22} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="section section--tight">
          <div className="container">
            <div className="cta">
              <div>
                <h2>Ready for your next trip?</h2>
                <p>Create a free account to save trips, track budgets and chat with the assistant.</p>
              </div>
              <Link to="/register" className="btn btn--light btn--lg">
                Create account
                <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
