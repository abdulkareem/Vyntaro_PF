import { adminService } from '../../services/adminApi'
import { useAsyncData } from '../hooks/useAsyncData'

export default function AdminDashboard() {
  const { data: usersData, loading: isLoading } = useAsyncData(adminService.listUsers, [])
  const users = usersData ?? []

  const total = users.length
  const active = users.filter((u) => u.isActive).length
  const deactivated = total - active
  const today = users.filter((u) => new Date(u.createdAt).toDateString() === new Date().toDateString()).length

  return (
    <div className="admin-grid">
      <div className="kpi-card"><span>Total Users</span><strong>{total}</strong></div>
      <div className="kpi-card"><span>Active Users</span><strong>{active}</strong></div>
      <div className="kpi-card"><span>Deactivated Users</span><strong>{deactivated}</strong></div>
      <div className="kpi-card"><span>New Registrations (Today)</span><strong>{today}</strong></div>

      <section className="panel chart-panel">
        <h3>User Growth (line)</h3>
        <div className="fake-chart">{isLoading ? 'Loading chart...' : users.slice(0, 12).map((_, i) => <span key={i} style={{ height: `${20 + i * 6}px` }} />)}</div>
      </section>

      <section className="panel chart-panel">
        <h3>Login Success vs Failure (bar)</h3>
        <div className="fake-bars">
          <div><label>Success</label><progress value={78} max={100} /></div>
          <div><label>Failure</label><progress value={22} max={100} /></div>
        </div>
      </section>

      <section className="panel table-panel">
        <h3>Recent Admin Activity (last 10)</h3>
        <table>
          <thead><tr><th>Action</th><th>Entity</th><th>Date</th></tr></thead>
          <tbody>
            {users.slice(0, 10).map((u) => <tr key={u.id}><td>User reviewed</td><td>{u.email}</td><td>{new Date(u.updatedAt).toLocaleString()}</td></tr>)}
          </tbody>
        </table>
      </section>
    </div>
  )
}
