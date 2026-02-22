import { Navigate } from 'react-router-dom'
import { isAdminAuthenticated } from '../../services/adminAuth'

export default function AdminGuard({ children }: { children: JSX.Element }) {
  if (!isAdminAuthenticated()) return <Navigate to="/admin/login" replace />
  return children
}
