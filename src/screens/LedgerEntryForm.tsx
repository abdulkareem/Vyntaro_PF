import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardTabs from '../components/dashboard/DashboardTabs'
import {
  LedgerCategory,
  createLedgerCategory,
  createLedgerEntry,
  fetchLedgerCategories
} from '../services/api/ledgerApi'
import { ApiRequestError } from '../services/api/httpClient'
import { clearDashboardCache } from '../hooks/useDashboardData'

type EntryType = 'expense' | 'income' | 'bill' | 'ledger'

const entryLabels: Record<EntryType, string> = {
  expense: 'Expense',
  income: 'Income',
  bill: 'Bill',
  ledger: 'Ledger'
}

export default function LedgerEntryForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const requestedType = (searchParams.get('type') || 'expense') as EntryType
  const type: EntryType = ['expense', 'income', 'bill', 'ledger'].includes(requestedType) ? requestedType : 'expense'

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [item, setItem] = useState('')
  const [particulars, setParticulars] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [categories, setCategories] = useState<LedgerCategory[]>([])
  const [busy, setBusy] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setCategoriesLoading(true)
    fetchLedgerCategories(type)
      .then(values => {
        setCategories(values)
        if (values[0]) setCategoryId(values[0].id)
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false))
  }, [type])

  const headerText = useMemo(() => `${entryLabels[type]} Entry`, [type])

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    setBusy(true)
    setError('')

    try {
      const category = await createLedgerCategory({ name: newCategory.trim(), type, showOnDashboard: true })
      setCategories(prev => [category, ...prev])
      setCategoryId(category.id)
      setNewCategory('')
      setMessage(`Category "${category.name}" added.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add category right now.')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (categoriesLoading) {
      setError('Categories are still loading. Please wait a moment and try again.')
      return
    }

    setBusy(true)
    setMessage('')
    setError('')

    try {
      await createLedgerEntry({
        type,
        date,
        item,
        particulars,
        amount: Number(amount),
        categoryId: categoryId || undefined,
        categoryName: categoryId ? undefined : newCategory.trim() || undefined
      })
      clearDashboardCache()
      navigate('/dashboard', { replace: true, state: { refreshDashboard: true } })
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError('Your session expired. Please log in again and retry.')
        navigate('/login', { replace: true })
        return
      }

      if (err instanceof ApiRequestError && err.status === 404) {
        setError('Ledger entry API route is unavailable. Please verify backend route configuration.')
        return
      }

      setError(err instanceof Error ? err.message : 'Unable to save entry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <section className="dashboard-card fade-in-up">
        <div className="ledger-form-header">
          <div>
            <h2 className="screen-title">{headerText}</h2>
            <p className="dashboard-subtitle">Capture it now and build a consistent, stress-free finance routine.</p>
          </div>
          <button type="button" className="header-btn" onClick={() => navigate('/dashboard/ledgerentry')}>Back</button>
        </div>

        <form className="ledger-form" onSubmit={handleSubmit}>
          <label className="ledger-field">
            <span>Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </label>

          <label className="ledger-field">
            <span>Items</span>
            <input
              type="text"
              value={item}
              onChange={e => setItem(e.target.value)}
              placeholder="Groceries, Rent, Transport..."
              required
            />
          </label>

          <label className="ledger-field">
            <span>Particulars</span>
            <textarea
              value={particulars}
              onChange={e => setParticulars(e.target.value)}
              placeholder="Add context, vendor, payment method, or notes"
              rows={3}
              required
            />
          </label>

          <label className="ledger-field">
            <span>Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>

          <label className="ledger-field">
            <span>Category</span>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} disabled={categoriesLoading || busy}>
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <div className="ledger-field">
            <span>Add New Category</span>
            <div className="ledger-category-inline">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="Create a new category"
              />
              <button type="button" className="header-btn" onClick={handleAddCategory} disabled={busy || categoriesLoading}>
                Add
              </button>
            </div>
          </div>

          <button type="submit" className="neo-btn neo-btn-primary" disabled={busy || categoriesLoading}>
            {busy ? 'Saving…' : `Save ${entryLabels[type]} Entry`}
          </button>

          {categoriesLoading ? <p className="dashboard-subtitle">Loading categories…</p> : null}
          {message && <p className="neo-success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </form>
      </section>
    </main>
  )
}
