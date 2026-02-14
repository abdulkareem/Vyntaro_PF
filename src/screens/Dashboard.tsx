import { currentUser } from '../services/auth'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const u = currentUser()
  return (
    <div className="section" id="dashboard">
      <h2>Dashboard</h2>
      <div className="section-content">
        <div>Welcome {u?.name}</div>
        <div>Mobile: {u?.mobile}</div>
        <div>Email: {u?.email}</div>
        <div>Trusted devices: {u?.trustedDevices.length ?? 0}</div>
        <div style={{ marginTop: 12 }}>
          <Link to="/change-pin">Change PIN</Link>
        </div>
      </div>
    </div>
  )
}
