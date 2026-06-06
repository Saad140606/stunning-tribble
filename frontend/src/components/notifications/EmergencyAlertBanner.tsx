import React from 'react';
import { AlertTriangle, MapPin, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const severityColor = {
  low: '#FFB800',
  medium: '#FF6B35',
  high: '#FF3B3B',
  critical: '#FF3B3B',
};

export function EmergencyAlertBanner() {
  const { latestEmergency, markRead } = useNotifications();
  if (!latestEmergency) return null;

  const color = severityColor[latestEmergency.severity ?? 'critical'];

  return (
    <div
      className="sticky top-0 z-[9998] mx-3 mt-3 rounded-xl p-3 flex items-start gap-3"
      style={{ background: 'rgba(255,59,59,0.12)', border: '1px solid rgba(255,59,59,0.28)', color: '#F0F4FF' }}
    >
      <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22`, color }}>
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black text-sm">{latestEmergency.title}</h3>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase" style={{ background: `${color}22`, color }}>
            {latestEmergency.severity ?? 'critical'}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: '#FFD8D8' }}>{latestEmergency.message}</p>
        {(latestEmergency.area || latestEmergency.distanceKm) && (
          <p className="text-[11px] mt-2 flex items-center gap-1" style={{ color: '#FFB8B8' }}>
            <MapPin className="h-3 w-3" />
            {latestEmergency.area ?? 'Nearby area'}
            {typeof latestEmergency.distanceKm === 'number' ? `, ${latestEmergency.distanceKm} km away` : ''}
          </p>
        )}
      </div>
      <button onClick={() => markRead(latestEmergency.id)} className="p-1.5 rounded-lg" style={{ color: '#FFB8B8' }} aria-label="Dismiss emergency alert">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
