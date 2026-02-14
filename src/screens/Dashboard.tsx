import { Link } from 'react-router-dom'
import { currentUser } from '../services/auth'

function maskMobile(mobile?: string) {
  if (!mobile) return '—'
  if (mobile.length <= 4) return mobile
  return `${mobile.slice(0, 3)} •••• ${mobile.slice(-3)}`
}

export default function Dashboard() {
  const u = currentUser()
  const displayName = u?.name ?? 'Member'
  const trustCount = u?.trustedDevices.length ?? 0

  return (
    <main className="neo-dashboard-screen" id="dashboard">
      <section className="neo-dashboard-grid">
        <article className="neo-panel neo-panel-hero">
          <p className="neo-kicker">Vyntaro Wealth</p>
          <h2>Welcome back, {displayName}</h2>
          <p className="neo-auth-sub">Your security, liquidity, and spending insights in one intelligent cockpit.</p>
          <div className="neo-hero-metrics">
            <div>
              <span>Total balance</span>
              <strong>$284,930.14</strong>
            </div>
            <div>
              <span>Today P/L</span>
              <strong className="neo-metric-up">+$3,820.70</strong>
            </div>
          </div>
        </article>

        <article className="neo-panel">
          <h3>Identity</h3>
          <div className="neo-info-list">
            <div><span>Mobile</span><strong>{maskMobile(u?.mobile)}</strong></div>
            <div><span>Email</span><strong>{u?.email ?? '—'}</strong></div>
            <div><span>Trusted devices</span><strong>{trustCount}</strong></div>
          </div>
          <Link className="neo-btn neo-btn-primary neo-inline-btn" to="/change-pin">Change PIN</Link>
        </article>

        <article className="neo-panel">
          <h3>Portfolio Mix</h3>
          <div className="neo-stat-bars">
            <div><label>Cash Reserve</label><b style={{ width: '74%' }} /></div>
            <div><label>Growth Funds</label><b style={{ width: '58%' }} /></div>
            <div><label>Stable Yield</label><b style={{ width: '42%' }} /></div>
          </div>
        </article>

        <article className="neo-panel">
          <h3>Recent activity</h3>
          <ul className="neo-activity-list">
            <li><span>USDT Transfer</span><b>+$2,400.00</b></li>
            <li><span>Card Settlement</span><b>-$620.30</b></li>
            <li><span>Yield Payout</span><b>+$190.45</b></li>
          </ul>
        </article>
      </section>
    </main>
  )
}
