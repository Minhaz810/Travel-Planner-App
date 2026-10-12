import { useState } from 'react'
import { budgetApi } from '../api'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_OPTIONS } from '../constants'
import { formatBdt, formatDate, todayIso } from '../utils'
import FormField from './FormField'
import Icon from './Icon'

function ErrorAlert({ message }) {
  return (
    <div className="alert alert--error" role="alert">
      <Icon name="alert" size={18} />
      {message}
    </div>
  )
}

// Runs `action`, turning DRF 400s into per-field errors and everything else into a general message.
async function submitWithErrors(action, setErrors, setSaving) {
  setErrors({})
  setSaving(true)
  try {
    await action()
  } catch (err) {
    setErrors(err.status === 400 && !err.data.detail ? err.data : { general: err.message })
    setSaving(false)
  }
}

function BudgetForm({ budget, onSave, onCancel }) {
  const [form, setForm] = useState({
    total_budget_bdt: budget ? String(Number(budget.total_budget_bdt)) : '',
    travelers: budget ? String(budget.travelers) : '1',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    submitWithErrors(
      () => onSave({ total_budget_bdt: form.total_budget_bdt, travelers: Number(form.travelers) || 1 }),
      setErrors,
      setSaving,
    )
  }

  return (
    <form className="form budget-form" onSubmit={handleSubmit} noValidate>
      {errors.general && <ErrorAlert message={errors.general} />}
      <div className="form__row">
        <FormField
          label="Total budget (৳)"
          name="total_budget_bdt"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="e.g. 10000"
          value={form.total_budget_bdt}
          onChange={update}
          error={errors.total_budget_bdt?.[0]}
          autoFocus={Boolean(budget)}
        />
        <FormField
          label="Travelers"
          name="travelers"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={form.travelers}
          onChange={update}
          error={errors.travelers?.[0]}
          hint="Used for the per-person split"
        />
      </div>
      <div className="form__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={saving || form.total_budget_bdt === ''}>
          {saving ? <span className="spinner spinner--light" /> : budget ? 'Save budget' : 'Set budget'}
        </button>
      </div>
    </form>
  )
}

function ExpenseForm({ expense, onSave, onCancel }) {
  const [form, setForm] = useState({
    category: expense?.category || 'food',
    amount_bdt: expense ? String(Number(expense.amount_bdt)) : '',
    date: expense?.date || todayIso(),
    note: expense?.note || '',
    paid_by: expense?.paid_by || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    submitWithErrors(
      () => onSave({ ...form, note: form.note.trim(), paid_by: form.paid_by.trim() }),
      setErrors,
      setSaving,
    )
  }

  return (
    <form className="form expense-form" onSubmit={handleSubmit} noValidate>
      {errors.general && <ErrorAlert message={errors.general} />}
      <div className="expense-form__grid">
        <label className={`field${errors.category ? ' field--error' : ''}`}>
          <span className="field__label">Category</span>
          <select name="category" value={form.category} onChange={update}>
            {EXPENSE_CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && <span className="field__error">{errors.category[0]}</span>}
        </label>
        <FormField
          label="Amount (৳)"
          name="amount_bdt"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={form.amount_bdt}
          onChange={update}
          error={errors.amount_bdt?.[0]}
          autoFocus
        />
        <FormField label="Date" name="date" type="date" value={form.date} onChange={update} error={errors.date?.[0]} />
        <FormField
          label="Note (optional)"
          name="note"
          maxLength={200}
          placeholder="e.g. Dinner at Panshi"
          value={form.note}
          onChange={update}
          error={errors.note?.[0]}
        />
        <FormField
          label="Paid by (optional)"
          name="paid_by"
          maxLength={100}
          placeholder="e.g. Karim"
          value={form.paid_by}
          onChange={update}
          error={errors.paid_by?.[0]}
        />
      </div>
      <div className="form__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary btn--sm" disabled={saving || !form.amount_bdt}>
          {saving ? <span className="spinner spinner--light" /> : expense ? 'Save expense' : 'Add expense'}
        </button>
      </div>
    </form>
  )
}

function Summary({ budget }) {
  const percent = budget.percent_used
  const over = budget.is_over_budget
  const spent = Number(budget.spent)
  const categories = EXPENSE_CATEGORY_OPTIONS.filter((c) => Number(budget.per_category[c.value]) > 0)

  return (
    <>
      <dl className="budget-stats">
        <div>
          <dt>Budget</dt>
          <dd>{formatBdt(budget.total_budget_bdt)}</dd>
        </div>
        <div>
          <dt>Spent</dt>
          <dd>{formatBdt(budget.spent)}</dd>
        </div>
        <div className={over ? 'is-over' : ''}>
          <dt>{over ? 'Over budget' : 'Remaining'}</dt>
          <dd>{formatBdt(over ? -Number(budget.remaining) : budget.remaining)}</dd>
        </div>
        <div>
          <dt>Per person ({budget.travelers})</dt>
          <dd>{formatBdt(budget.per_person)}</dd>
        </div>
      </dl>

      <div className="budget-progress">
        <div
          className={`budget-progress__bar${over ? ' is-over' : ''}`}
          role="progressbar"
          aria-label="Budget used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(percent ?? 100, 100)}
        >
          <span style={{ width: `${Math.min(percent ?? (spent > 0 ? 100 : 0), 100)}%` }} />
        </div>
        <p>{percent === null ? 'No budget amount set' : `${percent}% of budget used`}</p>
      </div>

      {categories.length > 0 && (
        <ul className="category-bars">
          {categories.map((c) => {
            const amount = Number(budget.per_category[c.value])
            return (
              <li key={c.value}>
                <span className="category-bars__label">
                  <Icon name={c.icon} size={15} />
                  {c.label}
                </span>
                <span className="category-bars__track">
                  <span style={{ width: `${(amount / spent) * 100}%` }} />
                </span>
                <strong>{formatBdt(amount)}</strong>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export default function BudgetTracker({ tripId, initialBudget }) {
  const [budget, setBudget] = useState(initialBudget)
  const [editingBudget, setEditingBudget] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState(null)

  // Totals are computed on the server, so reload the budget after every expense change.
  const refresh = async () => setBudget(await budgetApi.get(tripId))

  const saveBudget = async (payload) => {
    setBudget(await budgetApi.save(tripId, payload))
    setEditingBudget(false)
  }

  const addExpense = async (payload) => {
    await budgetApi.addExpense(tripId, payload)
    await refresh()
    setAdding(false)
  }

  const updateExpense = async (id, payload) => {
    await budgetApi.updateExpense(tripId, id, payload)
    await refresh()
    setEditingId(null)
  }

  const deleteExpense = async (expense) => {
    const label = expense.note || EXPENSE_CATEGORIES[expense.category].label
    if (!window.confirm(`Delete “${label}” (${formatBdt(expense.amount_bdt)})?`)) return
    setError(null)
    try {
      await budgetApi.deleteExpense(tripId, expense.id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!budget) {
    return (
      <article className="card budget">
        <header className="card__head">
          <h2>Budget tracker</h2>
          <p>Set a total budget in taka, then log expenses by category as you travel.</p>
        </header>
        <BudgetForm onSave={saveBudget} />
      </article>
    )
  }

  const usedCategories = EXPENSE_CATEGORY_OPTIONS.filter((c) => budget.expenses.some((e) => e.category === c.value))
  // Falls back to "All" if the filtered category no longer has expenses.
  const activeFilter = usedCategories.some((c) => c.value === filter) ? filter : ''
  const expenses = activeFilter ? budget.expenses.filter((e) => e.category === activeFilter) : budget.expenses

  return (
    <article className="card budget">
      <header className="card__head card__head--row">
        <h2>Budget tracker</h2>
        {!editingBudget && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingBudget(true)}>
            <Icon name="pencil" size={16} />
            Edit budget
          </button>
        )}
      </header>

      {editingBudget ? (
        <BudgetForm budget={budget} onSave={saveBudget} onCancel={() => setEditingBudget(false)} />
      ) : (
        <Summary budget={budget} />
      )}

      <section className="expenses">
        <header className="expenses__head">
          <h3>Expenses</h3>
          {!adding && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setAdding(true)
                setEditingId(null)
              }}
            >
              <Icon name="plus" size={16} />
              Add expense
            </button>
          )}
        </header>

        {error && <ErrorAlert message={error} />}

        {adding && <ExpenseForm onSave={addExpense} onCancel={() => setAdding(false)} />}

        {usedCategories.length > 1 && (
          <div className="chips" role="group" aria-label="Filter expenses">
            <button
              type="button"
              className={`chip${!activeFilter ? ' is-active' : ''}`}
              onClick={() => setFilter('')}
            >
              All
            </button>
            {usedCategories.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`chip${activeFilter === c.value ? ' is-active' : ''}`}
                aria-pressed={activeFilter === c.value}
                onClick={() => setFilter(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {budget.expenses.length === 0 && !adding && (
          <p className="muted">No expenses yet. Add one when you spend money on the trip.</p>
        )}

        {expenses.length > 0 && (
          <ul className="row-list">
            {expenses.map((expense) => {
              const category = EXPENSE_CATEGORIES[expense.category]
              if (editingId === expense.id) {
                return (
                  <li key={expense.id}>
                    <ExpenseForm
                      expense={expense}
                      onSave={(payload) => updateExpense(expense.id, payload)}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                )
              }
              return (
                <li key={expense.id}>
                  <span className="row-list__icon">
                    <Icon name={category.icon} size={18} />
                  </span>
                  <div className="row-list__main">
                    <strong>{expense.note || category.label}</strong>
                    <span>
                      {category.label} · {formatDate(expense.date)}
                      {expense.paid_by && ` · paid by ${expense.paid_by}`}
                    </span>
                  </div>
                  <span className="row-list__price">{formatBdt(expense.amount_bdt)}</span>
                  <span className="expense-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Edit expense"
                      onClick={() => {
                        setEditingId(expense.id)
                        setAdding(false)
                      }}
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      aria-label="Delete expense"
                      onClick={() => deleteExpense(expense)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </article>
  )
}
