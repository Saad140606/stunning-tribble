import React, { useState } from 'react';
import { BarChart3, Bell, Clock, FileText, LayoutDashboard, LogOut, Map, RadioTower, Siren, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="min-h-screen lg:flex" style={{ background: 'linear-gradient(160deg, #080e12 0%, #0e1417 45%, #121c20 100%)' }}>
      {/* Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col w-[272px] p-5"
        style={{
          background: 'rgba(26, 33, 35, 0.85)',
          borderRight: '1px solid rgba(168, 232, 255, 0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Brand */}
        <div className="mb-8">
          <h1
            style={{
              color: '#dde3e7',
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Fix Karachi
          </h1>
          <p
            style={{
              color: '#859398',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            COMMAND CENTER
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200"
                style={{
                  background: isActive
                    ? 'rgba(0, 212, 255, 0.1)'
                    : 'transparent',
                  color: isActive ? '#a8e8ff' : '#859398',
                  borderLeft: isActive ? '2px solid #00d4ff' : '2px solid transparent',
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <tab.icon className="w-4 h-4" style={{ opacity: isActive ? 1 : 0.7 }} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div
          className="pt-4 mt-4"
          style={{ borderTop: '1px solid rgba(168, 232, 255, 0.06)' }}
        >
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200"
            style={{
              color: '#ffb4ab',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Header */}
        <header
          className="sticky top-0 z-30 px-5 py-4"
          style={{
            background: 'rgba(14, 20, 23, 0.92)',
            borderBottom: '1px solid rgba(168, 232, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1
                style={{
                  color: '#dde3e7',
                  fontWeight: 700,
                  fontSize: 18,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  letterSpacing: '-0.01em',
                }}
              >
                Fix Karachi — Admin
              </h1>
              <p
                style={{
                  color: '#859398',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 2,
                }}
              >
                {profile?.phone ?? 'Authority Console'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell onOpenHistory={() => setActive('notifications')} />
              <button
                onClick={signOut}
                className="lg:hidden rounded-lg p-2.5 transition-colors"
                style={{
                  background: 'rgba(255, 180, 171, 0.08)',
                  color: '#ffb4ab',
                }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile tab bar */}
          <div className="lg:hidden mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className="shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200"
                  style={{
                    background: isActive ? '#00d4ff' : 'rgba(26, 33, 35, 0.8)',
                    color: isActive ? '#0e1417' : '#859398',
                    border: isActive ? 'none' : '1px solid rgba(168, 232, 255, 0.08)',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-5 lg:p-7 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {(active === 'dashboard' || active === 'analytics') && <DashboardScreen reports={reports} />}
              {active === 'emergency' && <EmergencyQueue reports={reports} />}
              {active === 'alerts' && <AdminEmergencyAlertForm />}
              {active === 'notifications' && <AdminNotificationPanel reports={reports} />}
              {active === 'heatmap' && <AdminHeatmap reports={reports} />}
              {active === 'users' && <UserManagement />}
              {!['dashboard', 'analytics', 'emergency', 'alerts', 'notifications', 'heatmap', 'users'].includes(active) && <ReportsTable reports={filtered} onLocalUpdate={onLocalUpdate} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
