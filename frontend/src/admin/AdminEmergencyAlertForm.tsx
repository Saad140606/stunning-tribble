import React, { useState } from 'react';
import { AlertTriangle, RadioTower, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { broadcastEmergencyAlert } from '../services/notificationService';
import { AlertSeverity } from '../types/notifications';

/* ── Design tokens from Stitch ── */
const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  surfaceLowest: '#080f12',
  onSurface: '#dde3e7',
  muted: '#859398',
  accent: '#00d4ff',
  error: '#ffb4ab',
  border: 'rgba(168, 232, 255, 0.07)',
  borderHover: 'rgba(168, 232, 255, 0.14)',
  fontHeadline: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontData: "'JetBrains Mono', monospace",
};

const glassCard: React.CSSProperties = {
  background: `linear-gradient(135deg, rgba(26,33,35,0.75) 0%, rgba(36,43,46,0.55) 100%)`,
  border: `1px solid rgba(255,180,171,0.12)`,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: 12,
};

const inputStyle: React.CSSProperties = {
  background: T.surfaceLowest,
  border: `1px solid ${T.border}`,
  color: T.onSurface,
  fontFamily: T.fontHeadline,
};

const severities: Array<{ value: AlertSeverity; label: string; color: string }> = [
  { value: 'low', label: 'Low', color: '#FFB800' },
  { value: 'medium', label: 'Medium', color: '#FF6B35' },
  { value: 'high', label: 'High', color: '#ffb4ab' },
  { value: 'critical', label: 'Critical', color: '#FF3B3B' },
];

export function AdminEmergencyAlertForm() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('high');
  const [area, setArea] = useState('Karachi');
  const [radiusKm, setRadiusKm] = useState<1 | 5 | 10>(5);
  const [lat, setLat] = useState('24.8607');
  const [lng, setLng] = useState('67.0011');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !area.trim()) {
      toast.error('Add title, description, and affected area');
      return;
    }

    setSubmitting(true);
    try {
      const result = await broadcastEmergencyAlert({
        title: title.trim(),
        description: description.trim(),
        severity,
        area: area.trim(),
        radiusKm,
        center: { lat: Number(lat), lng: Number(lng) },
        createdBy: profile?.uid ?? 'admin',
      });
      toast.success(`Alert sent to ${result.recipients} nearby users`);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Emergency broadcast failed:', err);
      toast.error('Emergency broadcast failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="p-5" style={glassCard}>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,180,171,0.08)', color: T.error, border: '1px solid rgba(255,180,171,0.15)' }}
          >
            <RadioTower className="h-5 w-5" />
          </div>
          <div>
            <h2 style={{ color: T.onSurface, fontWeight: 700, fontSize: 18, fontFamily: T.fontHeadline }}>Broadcast Emergency Alert</h2>
            <p style={{ color: T.muted, fontSize: 12, fontFamily: T.fontHeadline, marginTop: 2 }}>Targets users within the selected radius from the alert center.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Alert title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle} placeholder="Flood warning" />
          </label>
          <label className="block">
            <span className="text-xs font-bold" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Area affected</span>
            <input value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle} placeholder="Saddar, Karachi" />
          </label>
        </div>

        <label className="block mt-3">
          <span className="text-xs font-bold" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Alert description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none resize-none" style={inputStyle} placeholder="Flood warning reported near your area." />
        </label>

        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div>
            <span className="text-xs font-bold" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Severity</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {severities.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSeverity(item.value)}
                  className="rounded-lg px-3 py-2 text-xs font-bold transition-all"
                  style={{
                    background: severity === item.value ? `${item.color}18` : T.surfaceLowest,
                    color: item.color,
                    border: `1px solid ${severity === item.value ? `${item.color}40` : T.border}`,
                    fontFamily: T.fontHeadline,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Radius</span>
            <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value) as 1 | 5 | 10)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle}>
              <option value={1}>1 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-bold" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Latitude</span>
              <input value={lat} onChange={(e) => setLat(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={{ ...inputStyle, fontFamily: T.fontData, fontSize: 12 }} />
            </label>
            <label className="block">
              <span className="text-xs font-bold" style={{ color: T.muted, fontFamily: T.fontHeadline }}>Longitude</span>
              <input value={lng} onChange={(e) => setLng(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={{ ...inputStyle, fontFamily: T.fontData, fontSize: 12 }} />
            </label>
          </div>
        </div>

        <button
          disabled={submitting}
          className="mt-5 w-full md:w-auto px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-bold disabled:opacity-60 transition-all"
          style={{
            background: 'linear-gradient(135deg, #FF3B3B 0%, #ff6b6b 100%)',
            color: '#fff',
            fontFamily: T.fontHeadline,
            boxShadow: '0 0 20px rgba(255,59,59,0.2)',
          }}
        >
          {submitting ? <AlertTriangle className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Broadcasting...' : 'Broadcast Alert'}
        </button>
      </div>
    </form>
  );
}
