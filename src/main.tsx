import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import AdminAppProviders from './admin/components/AdminAppProviders'
import { revalidateSession } from './services/auth'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminAppProviders>
      <RouterProvider router={router} />
    </AdminAppProviders>
  </React.StrictMode>
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      registration.addEventListener('updatefound', () => {
        const nextWorker = registration.installing
        if (!nextWorker) return

        nextWorker.addEventListener('statechange', () => {
          if (nextWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.location.reload()
          }
        })
      })
    } catch {
      // ignore SW registration failures
    }
  })
}

window.addEventListener('online', () => {
  void revalidateSession()
})
