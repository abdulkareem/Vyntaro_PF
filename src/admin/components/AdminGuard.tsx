import { Navigate, useLocation } from 'react-router-dom'
import { clearAdminSession, isAdminAuthenticated } from '../../services/adminAuth'

export default function AdminGuard({ children }: { children: JSX.Element }) {
  const location = useLocation()
  if (!isAdminAuthenticated()) {
    clearAdminSession()
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }
  return children
}
