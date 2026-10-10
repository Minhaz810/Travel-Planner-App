import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { destinationsApi } from '../api'
import DestinationCard from '../components/DestinationCard'
import Icon from '../components/Icon'
import { CATEGORY_OPTIONS, MONTHS } from '../constants'
import useApi from '../hooks/useApi'
import useLanguage from '../hooks/useLanguage'
import { localized } from '../utils'

const FILTER_KEYS = ['search', 'division', 'category', 'month', 'max_daily_cost', 'ordering', 'page']
const PAGE_SIZE = 20

const BUDGET_OPTIONS = [1500, 2500, 4000, 6000]

const SORT_OPTIONS = [
  { value: '', label: 'Featured first' },
  { value: 'avg_daily_cost_bdt', label: 'Cost: low to high' },
  { value: '-avg_daily_cost_bdt', label: 'Cost: high to low' },
  { value: 'name_en', label: 'Name: A to Z' },
]

function Select({ label, value, onChange, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  )
}

export default function Destinations() {
  const lang = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || '']))
  const page = Number(filters.page) || 1
  const [searchText, setSearchText] = useState(filters.search)

  const divisions = useApi(destinationsApi.divisions())
  const { data, error, loading } = useApi(destinationsApi.list(filters))

  // Any filter change goes back to page 1.
  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchText('')
    setSearchParams({})
  }

  const hasFilters = FILTER_KEYS.some((key) => key !== 'page' && filters[key])
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  return (
    <section className="section destinations">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow eyebrow--plain">Explore Bangladesh</span>
          <h2>Find your next destination</h2>
        </div>

        <div className="filters card">
          <form
            className="filters__search"
            onSubmit={(e) => {
              e.preventDefault()
              setFilter('search', searchText.trim())
            }}
          >
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search by name or tag, e.g. sajek, waterfall"
              aria-label="Search destinations"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button type="submit" className="btn btn--primary btn--sm">
              Search
            </button>
          </form>

          <div className="filters__row">
            <Select label="Division" value={filters.division} onChange={(v) => setFilter('division', v)}>
              <option value="">All divisions</option>
              {divisions.data?.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {localized(d, 'name', lang)}
                </option>
              ))}
            </Select>
            <Select label="Best month" value={filters.month} onChange={(v) => setFilter('month', v)}>
              <option value="">Any month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Select>
            <Select label="Daily budget" value={filters.max_daily_cost} onChange={(v) => setFilter('max_daily_cost', v)}>
              <option value="">Any budget</option>
              {BUDGET_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  Up to ৳{b.toLocaleString('en-IN')}
                </option>
              ))}
            </Select>
            <Select label="Sort by" value={filters.ordering} onChange={(v) => setFilter('ordering', v)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="chips" role="group" aria-label="Category">
            <button
              type="button"
              className={`chip${!filters.category ? ' is-active' : ''}`}
              onClick={() => setFilter('category', '')}
            >
              All
            </button>
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`chip${filters.category === c.value ? ' is-active' : ''}`}
                aria-pressed={filters.category === c.value}
                onClick={() => setFilter('category', c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="results-bar">
          <p>{data ? `${data.count} destination${data.count === 1 ? '' : 's'}` : ' '}</p>
          {hasFilters && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
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

        {data && data.results.length === 0 && (
          <div className="empty-state">
            <Icon name="search" size={28} />
            <h3>No destinations match</h3>
            <p>Try a different search or remove some filters.</p>
          </div>
        )}

        {data && data.results.length > 0 && (
          <>
            <div className="dest-grid">
              {data.results.map((d) => (
                <DestinationCard key={d.slug} destination={d} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={!data.previous}
                  onClick={() => setFilter('page', String(page - 1))}
                >
                  <Icon name="chevronLeft" size={16} />
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={!data.next}
                  onClick={() => setFilter('page', String(page + 1))}
                >
                  Next
                  <Icon name="chevronRight" size={16} />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  )
}
