import { Link } from 'react-router-dom'
import { CATEGORY_LABELS, MONTHS } from '../constants'
import useLanguage from '../hooks/useLanguage'
import { formatBdt, localized } from '../utils'
import Icon from './Icon'

export default function DestinationCard({ destination }) {
  const lang = useLanguage()
  const name = localized(destination, 'name', lang)

  return (
    <Link to={`/destinations/${destination.slug}`} className="dest-card">
      <div className="dest-card__media">
        {destination.cover_image ? (
          <img src={destination.cover_image} alt={name} loading="lazy" />
        ) : (
          <span className="dest-card__placeholder">
            <Icon name="image" size={32} />
          </span>
        )}
        <span className="chip chip--overlay">{CATEGORY_LABELS[destination.category]}</span>
      </div>
      <div className="dest-card__body">
        <h3>{name}</h3>
        <p className="dest-card__place">
          <Icon name="mapPin" size={15} />
          {localized(destination.district, 'name', lang)}
        </p>
        <div className="dest-card__meta">
          <span>
            <strong>{formatBdt(destination.avg_daily_cost_bdt)}</strong> / day
          </span>
          {destination.best_months.length > 0 && (
            <span>
              <Icon name="calendar" size={14} />
              {destination.best_months.map((m) => MONTHS[m - 1]).join(', ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
