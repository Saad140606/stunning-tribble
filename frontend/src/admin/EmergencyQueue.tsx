import React, { useEffect, useState } from 'react';
import { Siren } from 'lucide-react';
import { AdminReport } from './useAdminReports';

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
          <div key={report.id} className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: '#0F2040', border: `1px solid ${urgent ? '#FF3B3B' : 'rgba(0,212,255,0.1)'}` }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,59,59,0.12)' }}>
                <Siren className="w-5 h-5" style={{ color: '#FF3B3B' }} />
              </div>
              <div>
                <h3 style={{ color: '#F0F4FF', fontWeight: 800 }}>{report.title}</h3>
                <p style={{ color: '#8BA3C7', fontSize: 13 }}>{report.location} • {report.phone ?? report.submittedBy}</p>
              </div>
            </div>
            <div className="text-right">
              <div style={{ color: urgent ? '#FF3B3B' : '#00D4FF', fontSize: 24, fontFamily: "'JetBrains Mono'", fontWeight: 800 }}>
                {report.status === 'resolved' ? 'Met' : formatRemaining(report.slaDeadline)}
              </div>
              <p style={{ color: '#8BA3C7', fontSize: 12 }}>15 min SLA</p>
            </div>
          </div>
        );
      })}
      {emergencies.length === 0 && <p style={{ color: '#8BA3C7' }}>No active emergencies.</p>}
    </div>
  );
}

