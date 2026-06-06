import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, CheckCheck, ExternalLink, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { CivicNotification } from '../../types/notifications';

interface NotificationBellProps {
  onOpenHistory?: () => void;
}

const typeLabel: Record<CivicNotification['type'], string> = {
  report_created: 'Report',
  report_verified: 'Verified',
  report_upvoted: 'Upvote',
  status_updated: 'Status',
  resolved: 'Resolved',
  admin_message: 'Admin',
  emergency_alert: 'Alert',
};

export function NotificationBell({ onOpenHistory }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    removeNotification,
    enablePushNotifications,
    pushEnabled,
  } = useNotifications();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const recent = notifications.slice(0, 8);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative h-11 w-11 rounded-lg flex items-center justify-center"
        style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.14)' }}
        aria-label={`Notifications (${unreadCount})`}
        title={`Notifications (${unreadCount})`}
      >
        {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center"
            style={{ background: '#FF3B3B', color: '#fff' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-3 w-[min(92vw,360px)] overflow-hidden rounded-xl shadow-2xl z-[10000]"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.18)' }}
        >
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
            <div>
              <h3 style={{ color: '#F0F4FF', fontWeight: 900, fontSize: 15 }}>Notifications ({unreadCount})</h3>
              <p style={{ color: '#8BA3C7', fontSize: 11 }}>{loading ? 'Syncing live updates...' : 'Real-time civic alerts'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 rounded-lg" style={{ color: '#8BA3C7' }} aria-label="Close notifications">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(0,212,255,0.09)', color: '#00D4FF' }}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all
            </button>
            <button
              onClick={enablePushNotifications}
              className="px-2.5 py-2 rounded-lg text-xs font-bold"
              style={{ background: pushEnabled ? 'rgba(0,200,150,0.12)' : 'rgba(255,184,0,0.12)', color: pushEnabled ? '#00C896' : '#FFB800' }}
            >
              {pushEnabled ? 'Push on' : 'Enable push'}
            </button>
            {onOpenHistory && (
              <button
                onClick={() => {
                  onOpenHistory();
                  setOpen(false);
                }}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold"
                style={{ color: '#8BA3C7' }}
              >
                <ExternalLink className="h-3.5 w-3.5" /> History
              </button>
            )}
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            {recent.map((notification) => (
              <div
                key={notification.id}
                className="p-3 flex gap-3"
                style={{ borderBottom: '1px solid rgba(0,212,255,0.06)', background: notification.read ? 'transparent' : 'rgba(0,212,255,0.04)' }}
              >
                <button
                  onClick={() => markRead(notification.id, !notification.read)}
                  className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: notification.read ? 'rgba(139,163,199,0.35)' : '#00D4FF' }}
                  aria-label={notification.read ? 'Mark unread' : 'Mark read'}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                      {typeLabel[notification.type]}
                    </span>
                    <span className="text-[10px]" style={{ color: '#4A6080' }}>{formatRelative(notification.createdAt)}</span>
                  </div>
                  <h4 className="mt-1 truncate" style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 13 }}>{notification.title}</h4>
                  <p className="mt-0.5 line-clamp-2" style={{ color: '#8BA3C7', fontSize: 12 }}>{notification.message}</p>
                </div>
                <button onClick={() => removeNotification(notification.id)} className="p-1.5 rounded-lg self-start" style={{ color: '#8BA3C7' }} aria-label="Delete notification">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {!recent.length && (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2" style={{ color: '#4A6080' }} />
                <p style={{ color: '#8BA3C7', fontSize: 13 }}>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelative(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
