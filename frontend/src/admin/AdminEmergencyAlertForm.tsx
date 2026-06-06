import React, { useState } from 'react';
import { AlertTriangle, RadioTower, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { broadcastEmergencyAlert } from '../services/notificationService';
import { AlertSeverity } from '../types/notifications';

const severities: Array<{ value: AlertSeverity; label: string; color: string }> = [
  { value: 'low', label: 'Low', color: '#FFB800' },
  { value: 'medium', label: 'Medium', color: '#FF6B35' },
  { value: 'high', label: 'High', color: '#FF3B3B' },
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
      <div className="rounded-xl p-4" style={{ background: '#0F2040', border: '1px solid rgba(255,59,59,0.18)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,59,59,0.12)', color: '#FF3B3B' }}>
            <RadioTower className="h-5 w-5" />
          </div>
          <div>
            <h2 style={{ color: '#F0F4FF', fontWeight: 900, fontSize: 18 }}>Broadcast Emergency Alert</h2>
            <p style={{ color: '#8BA3C7', fontSize: 12 }}>Targets users within the selected radius from the alert center.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold" style={{ color: '#8BA3C7' }}>Alert title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle} placeholder="Flood warning" />
          </label>
          <label className="block">
            <span className="text-xs font-bold" style={{ color: '#8BA3C7' }}>Area affected</span>
            <input value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle} placeholder="Saddar, Karachi" />
          </label>
        </div>

        <label className="block mt-3">
          <span className="text-xs font-bold" style={{ color: '#8BA3C7' }}>Alert description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none resize-none" style={inputStyle} placeholder="Flood warning reported near your area." />
        </label>

        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div>
            <span className="text-xs font-bold" style={{ color: '#8BA3C7' }}>Severity</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {severities.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSeverity(item.value)}
                  className="rounded-lg px-3 py-2 text-xs font-black"
                  style={{ background: severity === item.value ? `${item.color}22` : '#0A1628', color: item.color, border: `1px solid ${severity === item.value ? item.color : 'rgba(0,212,255,0.12)'}` }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold" style={{ color: '#8BA3C7' }}>Radius</span>
            <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value) as 1 | 5 | 10)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle}>
              <option value={1}>1 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-bold" style={{ color: '#8BA3C7' }}>Latitude</span>
              <input value={lat} onChange={(e) => setLat(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle} />
            </label>
            <label className="block">
              <span className="text-xs font-bold" style={{ color: '#8BA3C7' }}>Longitude</span>
              <input value={lng} onChange={(e) => setLng(e.target.value)} className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={inputStyle} />
            </label>
          </div>
        </div>

        <button
          disabled={submitting}
          className="mt-4 w-full md:w-auto px-5 py-3 rounded-lg flex items-center justify-center gap-2 font-black disabled:opacity-60"
          style={{ background: '#FF3B3B', color: '#fff' }}
        >
          {submitting ? <AlertTriangle className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
          {submitting ? 'Broadcasting...' : 'Broadcast Alert'}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0A1628',
  border: '1px solid rgba(0,212,255,0.14)',
  color: '#F0F4FF',
};
