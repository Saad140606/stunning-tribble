import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, Search, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationType } from '../../types/notifications';

const filters: Array<{ label: string; value: NotificationType | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Reports', value: 'report_created' },
  { label: 'Verified', value: 'report_verified' },
  { label: 'Status', value: 'status_updated' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Admin', value: 'admin_message' },
  { label: 'Alerts', value: 'emergency_alert' },
];

const PAGE_SIZE = 10;

export function NotificationsPage() {
  const { notifications, loading, error, markRead, markAllRead, removeNotification } = useNotifications();
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notifications.filter((item) => {
      if (filter !== 'all' && item.type !== filter) return false;
      if (!needle) return true;
      return `${item.title} ${item.message} ${item.area ?? ''}`.toLowerCase().includes(needle);
    });
  }, [filter, notifications, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="pb-12" style={{ background: 'transparent' }}>
      <div className="sticky top-0 z-40 px-4 py-4" style={{ background: 'rgba(10,22,40,0.97)', borderBottom: '1px solid rgba(0,212,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ color: '#F0F4FF', fontSize: 20, fontWeight: 900 }}>
              <Bell className="h-5 w-5" style={{ color: '#00D4FF' }} /> Notifications
            </h1>
            <p style={{ color: '#8BA3C7', fontSize: 12 }}>{loading ? 'Loading live updates...' : `${filtered.length} notifications`}</p>
          </div>
          <button onClick={markAllRead} className="h-10 px-3 rounded-lg flex items-center gap-2 text-xs font-bold" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
            <CheckCheck className="h-4 w-4" /> Read all
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8BA3C7' }} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search notifications"
            className="w-full pl-9 pr-3 py-3 rounded-lg outline-none text-sm"
            style={{ background: '#0F2040', color: '#F0F4FF', border: '1px solid rgba(0,212,255,0.14)' }}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setFilter(item.value);
                setPage(1);
              }}
              className="shrink-0 rounded-full px-3 py-2 text-xs font-bold"
              style={{ background: filter === item.value ? '#00D4FF' : '#0F2040', color: filter === item.value ? '#0A1628' : '#8BA3C7' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(255,184,0,0.1)', color: '#FFB800' }}>{error}</div>
        )}

        {pageItems.map((notification) => (
          <div key={notification.id} className="rounded-xl p-4" style={{ background: '#0F2040', border: notification.read ? '1px solid rgba(0,212,255,0.08)' : '1px solid rgba(0,212,255,0.24)' }}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => markRead(notification.id, !notification.read)}
                className="mt-1 h-3 w-3 rounded-full shrink-0"
                style={{ background: notification.read ? 'rgba(139,163,199,0.35)' : '#00D4FF' }}
                aria-label={notification.read ? 'Mark unread' : 'Mark read'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>
                    {notification.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px]" style={{ color: '#4A6080' }}>{notification.createdAt.toLocaleString()}</span>
                </div>
                <h2 className="mt-2" style={{ color: '#F0F4FF', fontWeight: 900 }}>{notification.title}</h2>
                <p className="mt-1 text-sm" style={{ color: '#8BA3C7' }}>{notification.message}</p>
              </div>
              <button onClick={() => removeNotification(notification.id)} className="p-2 rounded-lg" style={{ color: '#8BA3C7' }} aria-label="Delete notification">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {!pageItems.length && (
          <div className="rounded-xl p-8 text-center" style={{ background: '#0F2040', color: '#8BA3C7' }}>
            No notifications match this view.
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
            style={{ background: '#0F2040', color: '#8BA3C7' }}
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: '#8BA3C7' }}>Page {page} of {pageCount}</span>
          <button
            disabled={page === pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
            style={{ background: '#0F2040', color: '#8BA3C7' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
