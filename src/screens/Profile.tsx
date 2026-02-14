import DashboardTabs from '../components/dashboard/DashboardTabs'
import { currentUser } from '../services/auth'

export default function Profile() {
  const user = currentUser()

  return (
    <main className="dashboard-page">
      <DashboardTabs />
      <h2 className="screen-title">Profile</h2>
      <article className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Name</p>
        <p className="profile-value">{user?.name ?? 'Guest User'}</p>
      </article>
      <article className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Email</p>
        <p className="profile-value">{user?.email ?? 'Not available'}</p>
      </article>
      <article className="dashboard-card fade-in-up">
        <p className="dashboard-subtitle">Mobile</p>
        <p className="profile-value">{user?.mobile ?? 'Not available'}</p>
      </article>
    </main>
  )
}
