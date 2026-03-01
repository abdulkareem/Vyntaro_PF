import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  LedgerCategory,
  createLedgerCategory,
  createLedgerEntry,
  createLoanEntry,
  fetchLedgerCategories
} from '../services/api/ledgerApi'
import { ApiRequestError } from '../services/api/httpClient'
import { clearDashboardCache } from '../hooks/useDashboardData'

type EntryType = 'expense' | 'income' | 'bill' | 'ledger' | 'loan'
type LedgerFlowType = 'income' | 'expense'

const entryLabels: Record<EntryType, string> = {
  expense: 'Money Outflow',
  income: 'Money In Flow',
  bill: 'Bill Scan',
  ledger: 'Ledger Entry',
  loan: 'Loan / Money Lent'
}

const categorySuggestions: Record<EntryType, string[]> = {
  expense: ['Charity', 'Food', 'Travel', 'Utilities'],
  income: ['Salary', 'Freelance', 'Bonus'],
  bill: ['Electricity Bill', 'Water Bill', 'Internet Bill'],
  ledger: ['Income', 'Expense', 'Transfer'],
  loan: ['Money Lent', 'Loan', 'Settlement']
}

function normalizedEntryType(type: EntryType, ledgerFlowType: LedgerFlowType) {
  if (type === 'ledger') return ledgerFlowType
  return type
}

export default function LedgerEntryForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const requestedType = (searchParams.get('type') || 'expense') as EntryType
  const type: EntryType = ['expense', 'income', 'bill', 'ledger', 'loan'].includes(requestedType) ? requestedType : 'expense'

  const [ledgerFlowType, setLedgerFlowType] = useState<LedgerFlowType>('expense')
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

  const effectiveType = normalizedEntryType(type, ledgerFlowType)
  const categoryType = type === 'loan' ? 'ledger' : effectiveType

  useEffect(() => {
    setCategoriesLoading(true)
    setCategoryId('')

    fetchLedgerCategories(categoryType)
      .then(values => {
        setCategories(values)
        if (values[0]) setCategoryId(values[0].id)
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false))
  }, [categoryType])

  const headerText = useMemo(() => {
    if (type === 'ledger') return `${entryLabels[effectiveType]} Entry`
    return `${entryLabels[type]} Entry`
  }, [effectiveType, type])

  const handleAddCategory = async () => {
    const normalizedName = newCategory.trim()

    if (!normalizedName) {
      setError('Category name must not be empty.')
      return
    }

    if (categories.some(category => category.name.trim().toLowerCase() === normalizedName.toLowerCase())) {
      setError('Category already exists. Please choose it from the dropdown.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const payloadType = type === 'loan' ? 'ledger' : effectiveType
      const category = await createLedgerCategory({ name: normalizedName, type: payloadType, showOnDashboard: true })
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

    if (!item.trim()) {
      setError('Item is required.')
      return
    }

    if (!particulars.trim()) {
      setError('Particulars are required.')
      return
    }

    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than zero.')
      return
    }

    const fallbackCategoryName = newCategory.trim()
    if (!categoryId && !fallbackCategoryName) {
      setError('Please select or add a category before saving.')
      return
    }

    setBusy(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        date,
        item: item.trim(),
        particulars: particulars.trim(),
        amount: Number(amount),
        categoryId: categoryId || undefined,
        categoryName: categoryId ? undefined : fallbackCategoryName
      }

      if (type === 'loan') {
        await createLoanEntry({ ...payload, type: 'loan', loanKind: 'lent' })
      } else {
        await createLedgerEntry({ ...payload, type: effectiveType })
      }

      clearDashboardCache()
      setMessage('Entry saved successfully.')
      navigate('/dashboard', { replace: true, state: { refreshDashboard: true } })
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError('Your session expired. Please log in again and retry.')
        navigate('/login', { replace: true })
        return
      }

      if (err instanceof ApiRequestError && err.status === 404) {
        setError('Ledger API route is unavailable. Please verify backend route configuration.')
        return
      }

      setError(err instanceof Error ? err.message : 'Unable to save entry.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card fade-in-up">
        <div className="ledger-form-header">
          <div>
            <h2 className="screen-title">{headerText}</h2>
            <p className="dashboard-subtitle">Capture it now and build a consistent, stress-free finance routine.</p>
          </div>
          <button type="button" className="header-btn" onClick={() => navigate('/dashboard/ledgerentry')}>Back</button>
        </div>

        <form className="ledger-form" onSubmit={handleSubmit}>
          {type === 'ledger' ? (
            <label className="ledger-field">
              <span>Entry Type</span>
              <select value={ledgerFlowType} onChange={event => setLedgerFlowType(event.target.value as LedgerFlowType)} disabled={busy}>
                <option value="income">Money Inflow</option>
                <option value="expense">Money Outflow</option>
              </select>
            </label>
          ) : null}

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
            <p className="dashboard-subtitle">Suggestions: {categorySuggestions[type].join(', ')}</p>
          </div>

          <button type="submit" className="neo-btn neo-btn-primary" disabled={busy || categoriesLoading}>
            {busy ? 'Saving…' : 'Save Entry'}
          </button>

          {categoriesLoading ? <p className="dashboard-subtitle">Loading categories…</p> : null}
          {message && <p className="neo-success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </form>
      </section>
    </main>
  )
}
