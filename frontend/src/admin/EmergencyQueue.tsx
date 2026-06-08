import React, { useEffect, useState } from 'react';
import { Siren } from 'lucide-react';
import { AdminReport } from './useAdminReports';

/* ── Design tokens from Stitch ── */
const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  onSurface: '#dde3e7',
  muted: '#859398',
  accent: '#00d4ff',
  error: '#ffb4ab',
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

function formatRemaining(deadline?: Date) {
  if (!deadline) return 'No SLA';
  const diff = deadline.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minutes = Math.floor(abs / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  return `${diff < 0 ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function EmergencyQueue({ reports }: { reports: AdminReport[] }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const emergencies = reports.filter((report) => report.status === 'emergency' || report.priority === 10);

  return (
    <div className="grid gap-3">
      {emergencies.map((report) => {
        const remainingMs = (report.slaDeadline?.getTime() ?? Date.now()) - Date.now();
        const urgent = remainingMs < 5 * 60 * 1000;
        return (
          <div
            key={report.id}
            className="p-5 flex items-center justify-between gap-4"
            style={{
              ...glassCard,
              border: `1px solid ${urgent ? 'rgba(255,180,171,0.3)' : T.border}`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: urgent ? 'rgba(255,180,171,0.1)' : 'rgba(255,180,171,0.06)',
                  border: `1px solid ${urgent ? 'rgba(255,180,171,0.2)' : 'transparent'}`,
                }}
              >
                <Siren className="w-5 h-5" style={{ color: T.error }} />
              </div>
              <div>
                <h3 style={{ color: T.onSurface, fontWeight: 700, fontFamily: T.fontHeadline, fontSize: 15 }}>{report.title}</h3>
                <p style={{ color: T.muted, fontSize: 13, fontFamily: T.fontHeadline, marginTop: 2 }}>{report.location} · {report.phone ?? report.submittedBy}</p>
              </div>
            </div>
            <div className="text-right">
              <div
                style={{
                  color: urgent ? T.error : T.accent,
                  fontSize: 26,
                  fontFamily: T.fontData,
                  fontWeight: 700,
                  lineHeight: 1,
                  textShadow: urgent ? `0 0 20px rgba(255,180,171,0.3)` : `0 0 20px rgba(0,212,255,0.2)`,
                }}
              >
                {report.status === 'resolved' ? 'Met' : formatRemaining(report.slaDeadline)}
              </div>
              <p style={{ color: T.muted, fontSize: 11, fontFamily: T.fontData, marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>15 min SLA</p>
            </div>
          </div>
        );
      })}
      {emergencies.length === 0 && <p style={{ color: T.muted, fontFamily: T.fontHeadline }}>No active emergencies.</p>}
    </div>
  );
}
