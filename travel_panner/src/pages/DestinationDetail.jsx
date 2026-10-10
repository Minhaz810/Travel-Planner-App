import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { destinationsApi } from '../api'
import Icon from '../components/Icon'
import { CATEGORY_LABELS, MONTHS, STAY_TYPE_LABELS, STAY_TYPE_OPTIONS, TRANSPORT_MODE_LABELS } from '../constants'
import useApi from '../hooks/useApi'
import useLanguage from '../hooks/useLanguage'
import { formatBdt, localized } from '../utils'

function Loader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="spinner" />
    </div>
  )
}

function ErrorAlert({ error }) {
  return (
    <div className="alert alert--error" role="alert">
      <Icon name="alert" size={18} />
      {error.message}
    </div>
  )
}

function Gallery({ images, name }) {
  const [index, setIndex] = useState(() => Math.max(0, images.findIndex((img) => img.is_cover)))
  const current = images[index]

  if (!current) {
    return (
      <div className="gallery__main gallery__main--empty">
        <Icon name="image" size={40} />
      </div>
    )
  }

  return (
    <div className="gallery">
      <figure className="gallery__main">
        <img src={current.image} alt={current.caption_en || name} />
        {current.credit && <figcaption>Photo: {current.credit}</figcaption>}
      </figure>
      {images.length > 1 && (
        <div className="gallery__thumbs">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={`gallery__thumb${i === index ? ' is-active' : ''}`}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <img src={img.image} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Stays({ slug }) {
  const [stayType, setStayType] = useState('')
  const { data, error, loading } = useApi(destinationsApi.stays(slug, { stay_type: stayType }))
  const options = [{ value: '', label: 'All' }, ...STAY_TYPE_OPTIONS]

  return (
    <article className="card">
      <header className="card__head card__head--row">
        <h2>Where to stay</h2>
        <div className="chips" role="group" aria-label="Stay type">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`chip${stayType === o.value ? ' is-active' : ''}`}
              aria-pressed={stayType === o.value}
              onClick={() => setStayType(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </header>
      {error && <ErrorAlert error={error} />}
      {loading && <span className="spinner" role="status" aria-label="Loading" />}
      {data?.length === 0 && <p className="muted">No stays listed for this filter yet.</p>}
      {data?.length > 0 && (
        <ul className="row-list">
          {data.map((stay) => (
            <li key={stay.id}>
              <span className="row-list__icon">
                <Icon name="bed" size={18} />
              </span>
              <div className="row-list__main">
                <strong>{stay.name}</strong>
                <span>
                  {STAY_TYPE_LABELS[stay.stay_type]}
                  {stay.contact && ` · ${stay.contact}`}
                </span>
              </div>
              <span className="row-list__price">
                {formatBdt(stay.price_min_bdt)}–{formatBdt(stay.price_max_bdt)}
                <small>per night</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function GettingThere({ district, lang }) {
  const [from, setFrom] = useState('')
  const districts = useApi(destinationsApi.districts())
  const routes = useApi(from ? destinationsApi.routes({ from, to: district.slug }) : null)

  return (
    <article className="card">
      <header className="card__head">
        <h2>Getting there</h2>
        <p>Ways to reach {localized(district, 'name', lang)}. Flights are not included.</p>
      </header>
      <label className="field">
        <span className="field__label">Travelling from</span>
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">Choose a district</option>
          {districts.data
            ?.filter((d) => d.slug !== district.slug)
            .map((d) => (
              <option key={d.slug} value={d.slug}>
                {localized(d, 'name', lang)}
              </option>
            ))}
        </select>
      </label>

      {routes.error && <ErrorAlert error={routes.error} />}
      {routes.loading && <span className="spinner" role="status" aria-label="Loading" />}
      {routes.data?.length === 0 && <p className="muted">No routes added for this trip yet.</p>}
      {routes.data?.length > 0 && (
        <ul className="row-list">
          {routes.data.map((r) => (
            <li key={r.id}>
              <span className="row-list__icon">
                <Icon name="route" size={18} />
              </span>
              <div className="row-list__main">
                <strong>{TRANSPORT_MODE_LABELS[r.mode]}</strong>
                <span>
                  <Icon name="clock" size={13} /> {Number(r.duration_hrs)} hrs
                  {r.operators && ` · ${r.operators}`}
                </span>
                {r.notes && <span>{r.notes}</span>}
              </div>
              <span className="row-list__price">
                {formatBdt(r.cost_min_bdt)}–{formatBdt(r.cost_max_bdt)}
                <small>per person</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default function DestinationDetail() {
  const { slug } = useParams()
  const lang = useLanguage()
  const { data: dest, error, loading } = useApi(destinationsApi.detail(slug))

  if (loading) return <Loader />

  if (error) {
    return (
      <section className="section">
        <div className="container container--narrow">
          {error.status === 404 ? (
            <div className="empty-state">
              <Icon name="mapPin" size={28} />
              <h3>Destination not found</h3>
              <p>It may have been removed or the link is wrong.</p>
              <Link to="/destinations" className="btn btn--primary btn--sm">
                Browse destinations
              </Link>
            </div>
          ) : (
            <ErrorAlert error={error} />
          )}
        </div>
      </section>
    )
  }

  if (!dest) return null

  const name = localized(dest, 'name', lang)
  const tips = localized(dest, 'tips', lang)

  return (
    <section className="section destination">
      <div className="container">
        <Link to="/destinations" className="back-link">
          <Icon name="arrowLeft" size={16} />
          All destinations
        </Link>

        <header className="destination__head">
          <span className="chip">{CATEGORY_LABELS[dest.category]}</span>
          <h1>{name}</h1>
          <p className="dest-card__place">
            <Icon name="mapPin" size={16} />
            {localized(dest.district, 'name', lang)}
          </p>
        </header>

        <div className="destination__grid">
          <div className="destination__main">
            {/* key resets the selected photo when navigating between destinations */}
            <Gallery key={dest.slug} images={dest.images} name={name} />

            <article className="card">
              <header className="card__head">
                <h2>About</h2>
              </header>
              <p className="prose">{localized(dest, 'description', lang)}</p>
              {dest.tags.length > 0 && (
                <div className="chips chips--static">
                  {dest.tags.map((t) => (
                    <span key={t} className="chip">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {dest.attractions.length > 0 && (
              <article className="card">
                <header className="card__head">
                  <h2>Things to do</h2>
                </header>
                <ul className="row-list">
                  {dest.attractions.map((a) => (
                    <li key={a.id}>
                      <span className="row-list__icon">
                        <Icon name="sparkles" size={18} />
                      </span>
                      <div className="row-list__main">
                        <strong>{localized(a, 'name', lang)}</strong>
                        {localized(a, 'description', lang) && <span>{localized(a, 'description', lang)}</span>}
                        {a.duration_hrs && (
                          <span>
                            <Icon name="clock" size={13} /> about {Number(a.duration_hrs)} hrs
                          </span>
                        )}
                      </div>
                      {a.est_cost_bdt !== null && (
                        <span className="row-list__price">
                          {Number(a.est_cost_bdt) === 0 ? 'Free' : formatBdt(a.est_cost_bdt)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            )}

            <Stays key={`stays-${dest.slug}`} slug={dest.slug} />
          </div>

          <aside className="destination__side">
            <article className="card">
              <header className="card__head">
                <h2>Quick facts</h2>
              </header>
              <ul className="info-list">
                <li>
                  <Icon name="wallet" size={18} />
                  <div>
                    <span>Average daily cost</span>
                    <strong>{formatBdt(dest.avg_daily_cost_bdt)} per person</strong>
                  </div>
                </li>
                <li>
                  <Icon name="ticket" size={18} />
                  <div>
                    <span>Entry fee</span>
                    <strong>{dest.entry_fee_bdt === null ? 'None' : formatBdt(dest.entry_fee_bdt)}</strong>
                  </div>
                </li>
                <li>
                  <Icon name="calendar" size={18} />
                  <div>
                    <span>Best time to visit</span>
                    <strong>{dest.best_months.map((m) => MONTHS[m - 1]).join(', ') || 'Any time'}</strong>
                  </div>
                </li>
              </ul>
              <div className="months" aria-hidden="true">
                {MONTHS.map((m, i) => (
                  <span key={m} className={dest.best_months.includes(i + 1) ? 'is-best' : ''}>
                    {m[0]}
                  </span>
                ))}
              </div>
            </article>

            {tips && (
              <article className="card card--tip">
                <header className="card__head">
                  <h2>Travel tips</h2>
                </header>
                <p className="prose">{tips}</p>
              </article>
            )}

            <GettingThere key={`route-${dest.slug}`} district={dest.district} lang={lang} />
          </aside>
        </div>
      </div>
    </section>
  )
}
