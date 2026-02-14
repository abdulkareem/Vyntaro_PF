import { createBrowserRouter, Navigate } from 'react-router-dom'
import Register from './screens/Register'
import Verify from './screens/Verify'
import SetPin from './screens/SetPin'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import ForgotPin from './screens/ForgotPin'
import ChangePin from './screens/ChangePin'
import Shell from './shell/Shell'
import { isAuthenticated } from './services/auth'

function Protected({ children }: { children: JSX.Element }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'register', element: <Register /> },
      { path: 'verify', element: <Verify /> },
      { path: 'set-pin', element: <SetPin /> },
      { path: 'login', element: <Login /> },
      { path: 'forgot-pin', element: <ForgotPin /> },
      { path: 'change-pin', element: <Protected><ChangePin /></Protected> },
      { path: 'dashboard', element: <Protected><Dashboard /></Protected> }
    ]
  }
])

export default router
