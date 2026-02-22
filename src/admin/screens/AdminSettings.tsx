import { FormEvent, useState } from 'react'
import { adminService } from '../../services/adminApi'
import { useAdminToast } from '../state/AdminToast'

export default function AdminSettings() {
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [pinRule, setPinRule] = useState('4-digit numeric')
  const [saving, setSaving] = useState(false)
  const toast = useAdminToast()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await adminService.upsertSetting({ key: 'security.sessionTimeout', value: sessionTimeout })
      await adminService.upsertSetting({ key: 'security.pinRule', value: pinRule })
      toast.push('success', 'Settings saved')
    } catch {
      toast.push('error', 'Settings save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel settings-form" onSubmit={onSubmit}>
      <h3>Settings</h3>
      <label>Session Timeout (minutes)<input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(Number(e.target.value))} /></label>
      <label>PIN Rules<input value={pinRule} onChange={(e) => setPinRule(e.target.value)} /></label>
      <button disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
    </form>
  )
}
