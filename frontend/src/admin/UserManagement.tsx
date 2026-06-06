import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { User, Shield, CheckCircle, XCircle, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  cnic: string | null;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await apiFetch('/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (err) {
      toast.error('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (id: number, payload: Partial<UserRecord>) => {
    setSubmittingId(id);
    try {
      const response = await apiFetch(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'User updated');
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...payload } : u));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setSubmittingId(id);
    try {
      const response = await apiFetch(`/admin/users/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('User deleted successfully');
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    u.city.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#F0F4FF' }}>User Directory</h2>
          <p className="text-xs" style={{ color: '#8BA3C7' }}>Manage platform citizens and administrators</p>
        </div>

        <div className="relative flex items-center w-full sm:w-64">
          <Search className="absolute left-3 w-4 h-4" style={{ color: '#8BA3C7' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl outline-none"
            style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.18)', color: '#F0F4FF' }}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr style={{ background: '#0F2040', color: '#8BA3C7', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
              <th className="p-4">Name & Email</th>
              <th className="p-4">Phone & CNIC</th>
              <th className="p-4">City / Area</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: 'rgba(0,212,255,0.08)' }}>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8" style={{ color: '#8BA3C7' }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#0F2040]/30 transition-colors" style={{ color: '#F0F4FF' }}>
                  <td className="p-4">
                    <div className="font-bold flex items-center gap-2">
                      {user.full_name}
                      {user.role !== 'citizen' && (
                        <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
                      )}
                    </div>
                    <div className="text-xxs mt-0.5" style={{ color: '#8BA3C7' }}>{user.email}</div>
                  </td>
                  <td className="p-4">
                    <div>{user.phone}</div>
                    <div className="text-xxs mt-0.5" style={{ color: '#8BA3C7' }}>{user.cnic || 'No CNIC'}</div>
                  </td>
                  <td className="p-4">{user.city}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      disabled={submittingId === user.id}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        if (newRole !== user.role && (newRole === 'admin' || newRole === 'authority')) {
                          const confirmMsg = `WARNING: Are you sure you want to promote ${user.full_name} to ${newRole.toUpperCase()}?\n\nThis will grant them administrative access to civic console keys.`;
                          if (!window.confirm(confirmMsg)) {
                            e.target.value = user.role;
                            return;
                          }
                        }
                        handleUpdateUser(user.id, { role: newRole });
                      }}
                      className="px-2 py-1.5 rounded-md outline-none border text-xxs font-bold transition-all"
                      style={{
                        background: user.role === 'admin' ? 'rgba(239,68,68,0.12)' : user.role === 'authority' ? 'rgba(0,212,255,0.12)' : 'rgba(148,163,184,0.1)',
                        borderColor: user.role === 'admin' ? '#EF4444' : user.role === 'authority' ? '#00D4FF' : 'rgba(148,163,184,0.2)',
                        color: user.role === 'admin' ? '#EF4444' : user.role === 'authority' ? '#00D4FF' : '#94A3B8'
                      }}
                    >
                      <option value="citizen" className="bg-[#0F2040] text-[#94A3B8]">Citizen</option>
                      <option value="authority" className="bg-[#0F2040] text-[#00D4FF]">Authority</option>
                      <option value="admin" className="bg-[#0F2040] text-[#EF4444]">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateUser(user.id, { is_verified: !user.is_verified })}
                        disabled={submittingId === user.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xxs font-bold"
                        style={{
                          background: user.is_verified ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
                          color: user.is_verified ? '#22C55E' : '#94A3B8'
                        }}
                        title={user.is_verified ? 'Verified (Click to unverify)' : 'Unverified (Click to verify)'}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {user.is_verified ? 'Verified' : 'Unverified'}
                      </button>

                      <button
                        onClick={() => handleUpdateUser(user.id, { is_active: !user.is_active })}
                        disabled={submittingId === user.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xxs font-bold"
                        style={{
                          background: user.is_active ? 'rgba(0,212,255,0.1)' : 'rgba(239,68,68,0.1)',
                          color: user.is_active ? '#00D4FF' : '#EF4444'
                        }}
                        title={user.is_active ? 'Active (Click to suspend)' : 'Suspended (Click to activate)'}
                      >
                        {user.is_active ? 'Active' : 'Suspended'}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={submittingId === user.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-[#FF3B3B] transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
