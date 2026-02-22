import { useMemo, useState } from 'react'
import { AdminUser, adminService } from '../../services/adminApi'
import { useAdminToast } from '../state/AdminToast'
import { useAsyncData } from '../hooks/useAsyncData'

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [pinTarget, setPinTarget] = useState<AdminUser | null>(null)
  const [newPin, setNewPin] = useState('')
  const pageSize = 8
  const toast = useAdminToast()

  const { data: usersData, loading: isLoading, refresh } = useAsyncData(adminService.listUsers, [])
  const users = usersData ?? []

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.mobile.toLowerCase().includes(q)
  }), [users, search])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function updateUser(id: string, payload: Partial<Pick<AdminUser, 'name' | 'email' | 'isActive'>>) {
    try { await adminService.updateUser(id, payload); toast.push('success', 'User updated successfully'); refresh(); setEditing(null) } catch { toast.push('error', 'Update failed') }
  }
  async function deleteUser(id: string) {
    try { await adminService.deleteUser(id); toast.push('success', 'User deleted'); refresh(); setDeleting(null) } catch { toast.push('error', 'Delete failed') }
  }
  async function resetPin(id: string, pin: string) {
    try { await adminService.resetPin(id, pin); toast.push('success', 'PIN reset complete'); setPinTarget(null); setNewPin('') } catch { toast.push('error', 'PIN reset failed') }
  }

  return (
    <section className="panel">
      <div className="panel-head"><h3>Users Management</h3><input placeholder="Search by name/email/mobile" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div>
      {isLoading ? <p>Loading users...</p> : <table>
        <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>
          {current.map((u) => <tr key={u.id}>
            <td>{u.name}</td><td>{u.email}</td><td>{u.mobile}</td><td>{u.role}</td><td>{u.isActive ? 'Active' : 'Inactive'}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td>
            <td className="actions">
              <button onClick={() => setEditing(u)}>👁️</button><button onClick={() => setEditing(u)}>✏️</button><button onClick={() => setPinTarget(u)}>🔐</button>
              <button onClick={() => updateUser(u.id, { isActive: !u.isActive })}>{u.isActive ? '⏸️' : '▶️'}</button><button onClick={() => setDeleting(u)}>🗑️</button>
            </td>
          </tr>)}
        </tbody>
      </table>}
      <div className="pager"><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button><span>{page}/{pages}</span><button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button></div>

      {editing && <div className="modal"><div className="modal-card"><h4>User Detail / Edit</h4>
        <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
        <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
        <select value={editing.role} disabled><option>{editing.role}</option></select>
        <label><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
        <div className="modal-actions"><button onClick={() => setEditing(null)}>Cancel</button><button onClick={() => updateUser(editing.id, { name: editing.name, email: editing.email, isActive: editing.isActive })}>Save</button></div>
      </div></div>}

      {deleting && <div className="modal"><div className="modal-card"><h4>Delete user?</h4><p>This action cannot be undone.</p><div className="modal-actions"><button onClick={() => setDeleting(null)}>Cancel</button><button className="danger" onClick={() => deleteUser(deleting.id)}>Delete</button></div></div></div>}

      {pinTarget && <div className="modal"><div className="modal-card"><h4>Reset PIN ({pinTarget.name})</h4><input maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="4-digit PIN" /><div className="modal-actions"><button onClick={() => setPinTarget(null)}>Cancel</button><button onClick={() => resetPin(pinTarget.id, newPin)}>Reset PIN</button></div></div></div>}
    </section>
  )
}
