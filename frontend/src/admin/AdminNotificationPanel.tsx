import React, { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { AlertTriangle, Bell, CheckCircle2, Clock, FileText, ShieldCheck } from 'lucide-react';
import { firestore, isFirebaseConfigured } from '../lib/firebase';
import { AdminReport } from './useAdminReports';

interface AdminEvent {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
}

export function AdminNotificationPanel({ reports }: { reports: AdminReport[] }) {
  const [events, setEvents] = useState<AdminEvent[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    const eventsQuery = query(collection(firestore, 'adminNotifications'), orderBy('createdAt', 'desc'), limit(30));
    return onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map((item) => {
        const data = item.data() as { title?: string; message?: string; type?: string; createdAt?: Timestamp };
        return {
          id: item.id,
          title: data.title ?? 'Admin update',
          message: data.message ?? '',
          type: data.type ?? 'status_updated',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        };
      }));
    }, (error) => {
      console.error('Admin notification listener failed:', error);
    });
  }, []);

  const newReports = reports.filter((report) => report.status === 'reported').slice(0, 5);
  const emergencyReports = reports.filter((report) => report.status === 'emergency' || report.priority === 10).slice(0, 5);
  const verificationRequests = reports.filter((report) => report.status === 'flagged' || report.isDuplicate).slice(0, 5);
  const highPriority = reports.filter((report) => (report.priority ?? 0) >= 8 || report.status === 'emergency').slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Metric label="New reports" value={newReports.length} icon={FileText} color="#00D4FF" />
        <Metric label="Emergency" value={emergencyReports.length} icon={AlertTriangle} color="#FF3B3B" />
        <Metric label="Verification" value={verificationRequests.length} icon={ShieldCheck} color="#FFB800" />
        <Metric label="High priority" value={highPriority.length} icon={Clock} color="#FF6B35" />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Queue title="Emergency Reports" items={emergencyReports.map((r) => `${r.id}: ${r.title}`)} color="#FF3B3B" />
        <Queue title="High-Priority Complaints" items={highPriority.map((r) => `${r.id}: ${r.location}`)} color="#FF6B35" />
        <Queue title="New Reports" items={newReports.map((r) => `${r.id}: ${r.category} in ${r.district}`)} color="#00D4FF" />
        <Queue title="Verification Requests" items={verificationRequests.map((r) => `${r.id}: duplicate/flag review`)} color="#FFB800" />
      </div>

      <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
        <h2 className="flex items-center gap-2 mb-3" style={{ color: '#F0F4FF', fontWeight: 900 }}>
          <Bell className="h-5 w-5" style={{ color: '#00D4FF' }} /> Live Admin Events
        </h2>
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg p-3 flex items-start gap-3" style={{ background: '#0A1628' }}>
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#00C896' }} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 style={{ color: '#F0F4FF', fontWeight: 800, fontSize: 13 }}>{event.title}</h3>
                  <span className="text-[10px]" style={{ color: '#4A6080' }}>{event.createdAt.toLocaleTimeString()}</span>
                </div>
                <p style={{ color: '#8BA3C7', fontSize: 12 }}>{event.message}</p>
              </div>
            </div>
          ))}
          {!events.length && <p style={{ color: '#8BA3C7', fontSize: 13 }}>No live admin events yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
      <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}18`, color }}>
        <Icon className="h-5 w-5" />
      </div>
      <div style={{ color, fontSize: 28, fontWeight: 900 }}>{value}</div>
      <div style={{ color: '#8BA3C7', fontSize: 12 }}>{label}</div>
    </div>
  );
}

function Queue({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.1)' }}>
      <h2 className="mb-3" style={{ color: '#F0F4FF', fontWeight: 900 }}>{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-lg px-3 py-2 text-sm" style={{ background: '#0A1628', color: '#8BA3C7', borderLeft: `3px solid ${color}` }}>
            {item}
          </div>
        ))}
        {!items.length && <p style={{ color: '#4A6080', fontSize: 13 }}>No items right now.</p>}
      </div>
    </div>
  );
}
