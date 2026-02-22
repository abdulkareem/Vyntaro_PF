import { useMemo, useState } from 'react'
import { adminService } from '../../services/adminApi'
import { useAsyncData } from '../hooks/useAsyncData'
import { useAdminToast } from '../state/AdminToast'

export default function AdminRoles() {
  const { data: usersData, refresh } = useAsyncData(adminService.listUsers, [])
  const [selectedUser, setSelectedUser] = useState('')
  const [role, setRole] = useState('user')
  const toast = useAdminToast()
  const users = usersData ?? []

  const roles = useMemo(() => {
    const count = users.reduce<Record<string, number>>((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})
    return Object.entries(count)
  }, [users])

  async function handleAssign() {
    try {
      await adminService.updateUser(selectedUser, {})
      toast.push('info', role === 'superadmin' ? 'SuperAdmin role is locked and cannot be edited.' : 'Role assignment request submitted.')
      refresh()
    } catch {
      toast.push('error', 'Role assignment API is unavailable on current backend')
    }
  }

  return (
    <div className="panel">
      <h3>Roles & Permissions</h3>
      <table><thead><tr><th>Role</th><th>Users</th><th>Editable</th></tr></thead><tbody>{roles.map(([name, count]) => <tr key={name}><td>{name}</td><td>{count}</td><td>{name === 'superadmin' ? 'Locked' : 'Yes'}</td></tr>)}</tbody></table>
      <div className="role-grid">
        <h4>Assign role to user</h4>
        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}><option value="">Select user</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select>
        <select value={role} onChange={(e) => setRole(e.target.value)}><option value="user">User</option><option value="manager">Manager</option><option value="superadmin">SuperAdmin (Locked)</option></select>
        <div className="perm-grid">{['Users Read', 'Users Write', 'Transactions Read', 'Settings Write'].map((perm) => <label key={perm}><input type="checkbox" defaultChecked /> {perm}</label>)}</div>
        <button disabled={!selectedUser || role === 'superadmin'} onClick={handleAssign}>Assign Role</button>
      </div>
    </div>
  )
}
