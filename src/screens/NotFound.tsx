import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="neo-auth-screen">
      <section className="neo-auth-card">
        <h2>Page not found</h2>
        <p className="neo-auth-sub">The route you requested does not exist.</p>
        <Link className="neo-btn neo-btn-primary" to="/login">Go to Login</Link>
      </section>
    </main>
  )
}
