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
    <div className="pb-12 bg-[#0e1417] min-h-screen pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#e8f4f8] tracking-tight mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Notifications
            </h1>
            <p className="text-slate-400 font-medium">
              {loading ? 'Syncing updates...' : `You have ${filtered.length} notifications`}
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={markAllRead} className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-2">
              <CheckCheck className="w-5 h-5 text-[#00d4ff]" />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-[#1a2123]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-2 mb-8 flex flex-col md:flex-row gap-2">
          <div className="flex-1 flex gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {filters.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setFilter(item.value);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  filter === item.value
                    ? 'bg-gradient-to-r from-[#00d4ff] to-[#0099cc] text-[#0e1417] shadow-[0_0_15px_rgba(0,212,255,0.3)]'
                    : 'text-slate-400 hover:text-[#e8f4f8] hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search notifications..."
              className="w-full bg-[#0e1417] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#e8f4f8] focus:outline-none focus:border-[#00d4ff] transition-all"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-sm font-medium">
              {error}
            </div>
          )}

          {pageItems.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-[#1a2123]/80 backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 relative group overflow-hidden ${
                notification.read ? 'border-white/5 opacity-75 hover:opacity-100' : 'border-[#00d4ff]/30 shadow-[0_4px_20px_rgba(0,212,255,0.1)]'
              }`}
            >
              {!notification.read && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00d4ff] to-[#00ff94]"></div>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => markRead(notification.id, !notification.read)}
                  className={`mt-1 flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                    notification.read 
                      ? 'bg-white/5 border-white/10 text-slate-500' 
                      : 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]'
                  }`}
                  aria-label={notification.read ? 'Mark unread' : 'Mark read'}
                >
                  <Bell className="w-6 h-6" />
                </button>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                    <span className="px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 rounded-full text-xs font-bold uppercase tracking-wider">
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-slate-400">{notification.createdAt.toLocaleString()}</span>
                  </div>
                  <h3 className={`text-lg mb-1 tracking-wide ${notification.read ? 'font-semibold text-slate-300' : 'font-bold text-[#e8f4f8]'}`}>
                    {notification.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-4">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#00d4ff] text-sm font-bold rounded-lg transition-colors">
                      View Details
                    </button>
                    <button 
                      onClick={() => removeNotification(notification.id)} 
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!pageItems.length && (
            <div className="bg-[#1a2123]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center gap-4">
              <Bell className="w-12 h-12 opacity-20" />
              <p className="font-medium">No notifications match this view.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/10">
          <button
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center gap-2"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-400">Page {page} of {pageCount}</span>
          <button
            disabled={page === pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition-all flex items-center gap-2"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
