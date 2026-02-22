import { useState } from 'react'
import { adminService } from '../../services/adminApi'
import { useAsyncData } from '../hooks/useAsyncData'

const tabs = ['users', 'pinResetTokens', 'appSettings'] as const

export default function AdminDatabase() {
  const [tab, setTab] = useState<typeof tabs[number]>('users')
  const { data, loading: isLoading } = useAsyncData(adminService.listTables, [])
  const rows = (data?.[tab] as Record<string, unknown>[] | undefined) ?? []

  return (
    <section className="panel">
      <h3>Database Control</h3>
      <p className="warn-banner">Warning: Destructive actions permanently remove data.</p>
      <div className="tab-row">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      {isLoading ? <p>Loading table data...</p> : rows.length === 0 ? <p>No records.</p> : (
        <div className="table-scroll"><table><thead><tr>{Object.keys(rows[0]).slice(0, 8).map((k) => <th key={k}>{k}</th>)}<th>Controls</th></tr></thead>
          <tbody>{rows.slice(0, 20).map((r, index) => <tr key={index}>{Object.keys(rows[0]).slice(0, 8).map((k) => <td key={k}>{String(r[k])}</td>)}<td>Read / Edit / Delete</td></tr>)}</tbody>
        </table></div>
      )}
    </section>
  )
}
