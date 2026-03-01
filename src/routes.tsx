import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import Register from './screens/Register'
import Verify from './screens/Verify'
import SetPin from './screens/SetPin'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Transactions from './screens/Transactions'
import LedgerEntry from './screens/LedgerEntry'
import LedgerEntryForm from './screens/LedgerEntryForm'
import Analytics from './screens/Analytics'
import Profile from './screens/Profile'
import ForgotPin from './screens/ForgotPin'
import ChangePin from './screens/ChangePin'
import NotFound from './screens/NotFound'
import Shell from './shell/Shell'
import { isAuthenticated, requiresPinSetup } from './services/auth'

import AdminGuard from './admin/components/AdminGuard'
import { isAdminAuthenticated } from './services/adminAuth'
import AdminLayout from './admin/components/AdminLayout'
import AdminLogin from './admin/screens/AdminLogin'
import AdminDashboard from './admin/screens/AdminDashboard'
import AdminUsers from './admin/screens/AdminUsers'
import AdminRoles from './admin/screens/AdminRoles'
import AdminDatabase from './admin/screens/AdminDatabase'
import AdminSettings from './admin/screens/AdminSettings'
import AdminActivity from './admin/screens/AdminActivity'




function PublicOnly({ children }: { children: JSX.Element }) {
  const location = useLocation()
  if (isAuthenticated()) {
    const redirectTarget = requiresPinSetup() ? '/set-pin' : '/dashboard'
    return <Navigate to={redirectTarget} replace state={{ from: location.pathname }} />
  }
  return children
}

function Protected({ children }: { children: JSX.Element }) {
  const location = useLocation()
  if (!isAuthenticated()) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function PinSetupGuard({ children }: { children: JSX.Element }) {
  if (requiresPinSetup()) return <Navigate to="/set-pin" replace />
  return children
}

function AdminPublicOnly({ children }: { children: JSX.Element }) {
  if (isAdminAuthenticated()) return <Navigate to="/admin/dashboard" replace />
  return children
}

function LegacySetPinRedirect() {
  return <Navigate to="/set-pin" replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'register', element: <PublicOnly><Register /></PublicOnly> },
      { path: 'verify', element: <PublicOnly><Verify /></PublicOnly> },
      { path: 'set-pin', element: <PublicOnly><SetPin /></PublicOnly> },
      { path: 'set-pin/:legacyMode', element: <LegacySetPinRedirect /> },
      { path: 'login', element: <PublicOnly><Login /></PublicOnly> },
      { path: 'forgot-pin', element: <ForgotPin /> },
      { path: 'reset-pin', element: <ForgotPin /> },
      { path: 'change-pin', element: <Protected><PinSetupGuard><ChangePin /></PinSetupGuard></Protected> },
      { path: 'dashboard', element: <Protected><PinSetupGuard><Dashboard /></PinSetupGuard></Protected> },
      { path: 'dashboard/transactions', element: <Protected><PinSetupGuard><Transactions /></PinSetupGuard></Protected> },
      { path: 'dashboard/ledgerentry', element: <Protected><PinSetupGuard><LedgerEntry /></PinSetupGuard></Protected> },
      { path: 'dashboard/ledgerentry/new', element: <Protected><PinSetupGuard><LedgerEntryForm /></PinSetupGuard></Protected> },
      { path: 'dashboard/analytics', element: <Protected><PinSetupGuard><Analytics /></PinSetupGuard></Protected> },
      { path: 'dashboard/profile', element: <Protected><PinSetupGuard><Profile /></PinSetupGuard></Protected> },
      { path: 'admin/login', element: <AdminPublicOnly><AdminLogin /></AdminPublicOnly> },
      {
        path: 'admin',
        element: <AdminGuard><AdminLayout /></AdminGuard>,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'roles', element: <AdminRoles /> },
          { path: 'database', element: <AdminDatabase /> },
          { path: 'activity', element: <AdminActivity /> },
          { path: 'settings', element: <AdminSettings /> }
        ]
      },
      { path: '*', element: <NotFound /> }
    ]
  }
])

export default router
