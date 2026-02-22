import { AdminToastProvider } from '../state/AdminToast'

export default function AdminAppProviders({ children }: { children: React.ReactNode }) {
  return <AdminToastProvider>{children}</AdminToastProvider>
}
