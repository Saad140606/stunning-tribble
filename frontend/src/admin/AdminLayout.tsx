import React, { useState } from 'react';
import { BarChart3, Bell, Clock, FileText, LayoutDashboard, LogOut, Map, RadioTower, Siren, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from './DashboardScreen';
import { ReportsTable } from './ReportsTable';
import { EmergencyQueue } from './EmergencyQueue';
import { AdminReport, useAdminReports } from './useAdminReports';
import { UserManagement } from './UserManagement';
import { AdminHeatmap } from './AdminHeatmap';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { AdminEmergencyAlertForm } from './AdminEmergencyAlertForm';
import { AdminNotificationPanel } from './AdminNotificationPanel';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'all', label: 'All Reports', icon: FileText },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'inprogress', label: 'In Progress', icon: Clock },
  { id: 'resolved', label: 'Resolved', icon: FileText },
  { id: 'emergency', label: 'Emergency Queue', icon: Siren },
  { id: 'alerts', label: 'Broadcast Alerts', icon: RadioTower },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'heatmap', label: 'Heatmap', icon: Map },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'users', label: 'User Directory', icon: Users },
];

export function AdminApp() {
  const [active, setActive] = useState('dashboard');
  const { reports, setReports } = useAdminReports();
  const { profile, signOut } = useAuth();

  const filtered = reports.filter((report) => {
    if (active === 'all' || active === 'dashboard' || active === 'analytics' || active === 'heatmap' || active === 'notifications' || active === 'alerts') return true;
    if (active === 'pending') return report.status === 'reported';
    if (active === 'emergency') return report.status === 'emergency' || report.priority === 10;
    return report.status === active;
  });

  const onLocalUpdate = (updated: AdminReport) => {
    setReports((prev) => prev.map((report) => report.id === updated.id ? updated : report));
  };

  return (
    <div className="min-h-screen lg:flex" style={{ background: 'linear-gradient(160deg, #081223 0%, #0A1628 45%, #0D1F3C 100%)' }}>
      <aside className="hidden lg:block w-64 p-4" style={{ background: 'rgba(8, 18, 35, 0.95)', borderRight: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <h1 className="mb-6" style={{ color: '#F0F4FF', fontSize: 22, fontWeight: 900 }}>KMC Admin Panel</h1>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left"
              style={{ background: active === tab.id ? 'rgba(0,212,255,0.12)' : 'transparent', color: active === tab.id ? '#00D4FF' : '#8BA3C7' }}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="sticky top-0 z-30 p-4" style={{ background: 'rgba(10,22,40,0.97)', borderBottom: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 style={{ color: '#F0F4FF', fontWeight: 900, fontSize: 20 }}>KMC Admin Panel</h1>
              <p style={{ color: '#8BA3C7', fontSize: 13 }}>{profile?.phone ?? 'Authority Console'}</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell onOpenHistory={() => setActive('notifications')} />
              <button onClick={signOut} className="rounded-xl p-3" style={{ background: 'rgba(255,59,59,0.1)', color: '#FF3B3B' }}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="lg:hidden mt-4 flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className="shrink-0 rounded-full px-3 py-2 text-xs"
                style={{ background: active === tab.id ? '#00D4FF' : '#0F2040', color: active === tab.id ? '#0A1628' : '#8BA3C7' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {(active === 'dashboard' || active === 'analytics') && <DashboardScreen reports={reports} />}
          {active === 'emergency' && <EmergencyQueue reports={reports} />}
          {active === 'alerts' && <AdminEmergencyAlertForm />}
          {active === 'notifications' && <AdminNotificationPanel reports={reports} />}
          {active === 'heatmap' && <AdminHeatmap reports={reports} />}
          {active === 'users' && <UserManagement />}
          {!['dashboard', 'analytics', 'emergency', 'alerts', 'notifications', 'heatmap', 'users'].includes(active) && <ReportsTable reports={filtered} onLocalUpdate={onLocalUpdate} />}
        </div>
      </main>
    </div>
  );
}
