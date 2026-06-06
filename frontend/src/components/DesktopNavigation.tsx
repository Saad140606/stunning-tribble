import React from 'react';
import { BarChart3, Bell, Home, Map, Plus, User, Shield, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../App';
import { useAuth } from '../context/AuthContext';

interface DesktopNavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  onToggleLanguage: () => void;
  languageLabel: string;
  isOnline?: boolean;
}

const navItems: Array<{ id: Screen; label: string; icon: React.ElementType; description: string }> = [
  { id: 'home', label: 'Live Feed', icon: Home, description: 'Latest reports' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'City dashboard' },
  { id: 'report', label: 'Report Issue', icon: Plus, description: 'Submit a report' },
  { id: 'map', label: 'Civic Map', icon: Map, description: 'Live heatmap' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & updates' },
  { id: 'profile', label: 'My Profile', icon: User, description: 'Your reports' },
];

export function DesktopNavigation({
  currentScreen,
  onScreenChange,
  onToggleLanguage,
  languageLabel,
  isOnline = true,
}: DesktopNavigationProps) {
  const { profile, user: authUser } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : authUser?.email?.slice(0, 2).toUpperCase() || 'FK';

  return (
    <aside className="fk-desktop-nav">
      {/* Brand */}
      <div className="fk-desktop-brand">
        <motion.div
          className="fk-brand-mark"
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
        >
          FK
        </motion.div>
        <div>
          <h1 className="fk-desktop-brand h1">Fix Karachi</h1>
          <p className="fk-desktop-brand p">Civic Command Center</p>
        </div>
        {/* Live status dot */}
        <div
          style={{
            marginLeft: 'auto',
            width: 8, height: 8, borderRadius: '50%',
            background: isOnline ? '#00C896' : '#FF3B3B',
            boxShadow: isOnline ? '0 0 8px rgba(0,200,150,0.6)' : '0 0 8px rgba(255,59,59,0.6)',
            flexShrink: 0,
          }}
          title={isOnline ? 'Online' : 'Offline'}
        />
      </div>

      {/* Section label */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#2A4060', textTransform: 'uppercase', padding: '0 4px 8px', marginTop: 4 }}>
        Navigation
      </p>

      {/* Nav items */}
      <nav className="fk-desktop-nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentScreen === item.id;
          const isReport = item.id === 'report';

          return (
            <motion.button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className="fk-desktop-nav-item"
              data-active={active}
              whileHover={{ x: active ? 0 : 3 }}
              whileTap={{ scale: 0.97 }}
              style={
                isReport
                  ? {
                      background: active ? 'rgba(0,212,255,0.12)' : 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(139,92,246,0.06))',
                      color: '#00D4FF',
                      border: '1px solid rgba(0,212,255,0.2)',
                      marginTop: 4,
                    }
                  : {}
              }
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  background: active ? 'rgba(0,212,255,0.12)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                {active && (
                  <div style={{ fontSize: 10, color: '#4A9080', marginTop: 1, lineHeight: 1 }}>
                    {item.description}
                  </div>
                )}
              </div>
              {item.id === 'notifications' && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(255,59,59,0.15)', color: '#FF3B3B',
                  fontSize: 9, fontWeight: 700,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  3
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0,212,255,0.07)', margin: '14px 0' }} />

      {/* Footer */}
      <div className="fk-desktop-nav-footer">
        {/* User info */}
        <div className="fk-desktop-nav-user">
          <div className="fk-desktop-nav-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name || authUser?.email?.split('@')[0] || 'Citizen'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {profile?.role === 'admin' && <Shield className="w-3 h-3" style={{ color: '#00D4FF' }} />}
              <p style={{ fontSize: 10, color: '#4A6080', textTransform: 'capitalize' }}>
                {isOnline ? '🟢' : '🔴'} {profile?.role || 'Citizen'}
              </p>
            </div>
          </div>
        </div>

        {/* Language toggle */}
        <button className="fk-language-btn" onClick={onToggleLanguage}>
          🌐 {languageLabel}
        </button>
      </div>
    </aside>
  );
}
