import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { User, Shield, CheckCircle, XCircle, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/* ── Design tokens from Stitch ── */
const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  surfaceHigh: '#242b2e',
  surfaceLowest: '#080f12',
  onSurface: '#dde3e7',
  onSurfaceVariant: '#bbc9cf',
  muted: '#859398',
  accent: '#00d4ff',
  accentSoft: 'rgba(0, 212, 255, 0.08)',
  border: 'rgba(168, 232, 255, 0.07)',
  borderHover: 'rgba(168, 232, 255, 0.14)',
  fontHeadline: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontData: "'JetBrains Mono', monospace",
};

const glassCard: React.CSSProperties = {
  background: `linear-gradient(135deg, rgba(26,33,35,0.75) 0%, rgba(36,43,46,0.55) 100%)`,
  border: `1px solid ${T.border}`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl" style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline }}>User Directory</h2>
          <p className="text-xs mt-1" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Manage platform citizens and administrators</p>
        </div>

        <div className="relative flex items-center w-full sm:w-64">
          <Search className="absolute left-3 w-4 h-4" style={{ color: T.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg outline-none"
            style={{ background: T.surfaceLowest, border: `1px solid ${T.border}`, color: T.onSurface, fontFamily: T.fontHeadline }}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ ...glassCard }}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr style={{ background: T.surfaceLowest, color: T.muted, borderBottom: `1px solid ${T.border}` }}>
              <th className="p-4" style={{ fontFamily: T.fontHeadline, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Name & Email</th>
              <th className="p-4" style={{ fontFamily: T.fontHeadline, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Phone & CNIC</th>
              <th className="p-4" style={{ fontFamily: T.fontHeadline, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>City / Area</th>
              <th className="p-4" style={{ fontFamily: T.fontHeadline, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Role</th>
              <th className="p-4" style={{ fontFamily: T.fontHeadline, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Status</th>
              <th className="p-4 text-center" style={{ fontFamily: T.fontHeadline, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8" style={{ color: T.muted, fontFamily: T.fontHeadline }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="transition-colors" style={{ color: T.onSurface, borderTop: `1px solid ${T.border}` }}>
                  <td className="p-4">
                    <div className="font-bold flex items-center gap-2" style={{ fontFamily: T.fontHeadline }}>
                      {user.full_name}
                      {user.role !== 'citizen' && (
                        <Shield className="w-3.5 h-3.5" style={{ color: T.accent }} />
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: T.muted, fontFamily: T.fontData }}>{user.email}</div>
                  </td>
                  <td className="p-4">
                    <div style={{ fontFamily: T.fontData, fontSize: 12 }}>{user.phone}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: T.muted, fontFamily: T.fontData }}>{user.cnic || 'No CNIC'}</div>
                  </td>
                  <td className="p-4" style={{ fontFamily: T.fontHeadline }}>{user.city}</td>
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
                      className="px-2 py-1.5 rounded-lg outline-none text-[11px] font-bold transition-all"
                      style={{
                        background: user.role === 'admin' ? 'rgba(255,180,171,0.08)' : user.role === 'authority' ? T.accentSoft : 'rgba(133,147,152,0.08)',
                        border: `1px solid ${user.role === 'admin' ? 'rgba(255,180,171,0.2)' : user.role === 'authority' ? 'rgba(0,212,255,0.15)' : T.border}`,
                        color: user.role === 'admin' ? '#ffb4ab' : user.role === 'authority' ? T.accent : T.muted,
                        fontFamily: T.fontData,
                      }}
                    >
                      <option value="citizen" style={{ background: T.surface, color: T.muted }}>Citizen</option>
                      <option value="authority" style={{ background: T.surface, color: T.accent }}>Authority</option>
                      <option value="admin" style={{ background: T.surface, color: '#ffb4ab' }}>Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateUser(user.id, { is_verified: !user.is_verified })}
                        disabled={submittingId === user.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold transition-colors"
                        style={{
                          background: user.is_verified ? 'rgba(0,200,150,0.08)' : 'rgba(133,147,152,0.08)',
                          color: user.is_verified ? '#00C896' : T.muted,
                          fontFamily: T.fontData,
                        }}
                        title={user.is_verified ? 'Verified (Click to unverify)' : 'Unverified (Click to verify)'}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {user.is_verified ? 'Verified' : 'Unverified'}
                      </button>

                      <button
                        onClick={() => handleUpdateUser(user.id, { is_active: !user.is_active })}
                        disabled={submittingId === user.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold transition-colors"
                        style={{
                          background: user.is_active ? T.accentSoft : 'rgba(255,180,171,0.08)',
                          color: user.is_active ? T.accent : '#ffb4ab',
                          fontFamily: T.fontData,
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
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#ffb4ab' }}
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
