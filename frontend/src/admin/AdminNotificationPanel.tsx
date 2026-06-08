import React, { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { AlertTriangle, Bell, CheckCircle2, Clock, FileText, ShieldCheck } from 'lucide-react';
import { firestore, isFirebaseConfigured } from '../lib/firebase';
import { AdminReport } from './useAdminReports';

/* ── Design tokens from Stitch ── */
const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  surfaceLowest: '#080f12',
  onSurface: '#dde3e7',
  muted: '#859398',
  accent: '#00d4ff',
  accentSoft: 'rgba(0, 212, 255, 0.08)',
  border: 'rgba(168, 232, 255, 0.07)',
  fontHeadline: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontData: "'JetBrains Mono', monospace",
};

const glassCard: React.CSSProperties = {
  background: `linear-gradient(135deg, rgba(26,33,35,0.75) 0%, rgba(36,43,46,0.55) 100%)`,
  border: `1px solid ${T.border}`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 12,
};

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
        <Metric label="New reports" value={newReports.length} icon={FileText} color={T.accent} />
        <Metric label="Emergency" value={emergencyReports.length} icon={AlertTriangle} color="#ffb4ab" />
        <Metric label="Verification" value={verificationRequests.length} icon={ShieldCheck} color="#FFB800" />
        <Metric label="High priority" value={highPriority.length} icon={Clock} color="#FF6B35" />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Queue title="Emergency Reports" items={emergencyReports.map((r) => `${r.id}: ${r.title}`)} color="#ffb4ab" />
        <Queue title="High-Priority Complaints" items={highPriority.map((r) => `${r.id}: ${r.location}`)} color="#FF6B35" />
        <Queue title="New Reports" items={newReports.map((r) => `${r.id}: ${r.category} in ${r.district}`)} color={T.accent} />
        <Queue title="Verification Requests" items={verificationRequests.map((r) => `${r.id}: duplicate/flag review`)} color="#FFB800" />
      </div>

      <div className="p-5" style={glassCard}>
        <h2 className="flex items-center gap-2 mb-4" style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15 }}>
          <Bell className="h-5 w-5" style={{ color: T.accent }} /> Live Admin Events
        </h2>
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg p-3 flex items-start gap-3" style={{ background: T.surfaceLowest, border: `1px solid ${T.border}` }}>
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#00C896' }} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 style={{ color: T.onSurface, fontWeight: 700, fontSize: 13, fontFamily: T.fontHeadline }}>{event.title}</h3>
                  <span className="text-[10px]" style={{ color: T.muted, fontFamily: T.fontData }}>{event.createdAt.toLocaleTimeString()}</span>
                </div>
                <p style={{ color: T.muted, fontSize: 12, fontFamily: T.fontHeadline, marginTop: 2 }}>{event.message}</p>
              </div>
            </div>
          ))}
          {!events.length && <p style={{ color: T.muted, fontSize: 13, fontFamily: T.fontHeadline }}>No live admin events yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="p-4" style={glassCard}>
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}12`, color, border: `1px solid ${color}20` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div style={{ color, fontSize: 28, fontWeight: 700, fontFamily: T.fontData, lineHeight: 1 }}>{value}</div>
      <div style={{ color: T.muted, fontSize: 12, fontFamily: T.fontHeadline, fontWeight: 500, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Queue({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="p-5" style={glassCard}>
      <h2 className="mb-3" style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15 }}>{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-lg px-3 py-2.5 text-sm"
            style={{
              background: T.surfaceLowest,
              color: T.muted,
              borderLeft: `3px solid ${color}`,
              fontFamily: T.fontHeadline,
              fontSize: 13,
            }}
          >
            {item}
          </div>
        ))}
        {!items.length && <p style={{ color: T.muted, fontSize: 13, fontFamily: T.fontHeadline }}>No items right now.</p>}
      </div>
    </div>
  );
}
