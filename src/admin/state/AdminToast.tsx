import { createContext, useContext, useMemo, useState } from 'react'

type Toast = { id: number; type: 'success' | 'error' | 'info'; message: string }
const ToastContext = createContext<{ push: (type: Toast['type'], message: string) => void } | null>(null)

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const value = useMemo(() => ({
    push(type: Toast['type'], message: string) {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
    }
  }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="admin-toast-wrap">
        {toasts.map((t) => <div key={t.id} className={`admin-toast ${t.type}`}>{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  )
}

export function useAdminToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useAdminToast must be used in AdminToastProvider')
  return context
}
