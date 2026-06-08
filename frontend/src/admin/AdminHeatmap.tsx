import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AdminReport } from './useAdminReports';

// Extend the L namespace for heat plugin
declare module 'leaflet' {
  function heatLayer(latlngs: any[], options?: any): any;
}

/* ── Design tokens from Stitch ── */
const T = {
  bg: '#0e1417',
  surface: '#1a2123',
  onSurface: '#dde3e7',
  muted: '#859398',
  accent: '#00d4ff',
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

const categoryColors: Record<string, string> = {
  'Road Infrastructure': '#FF6B35',
  'Water': '#00D4FF',
  'Water Supply': '#00D4FF',
  'Waste': '#00C896',
  'Waste Management': '#00C896',
  'Gas Leak': '#FF3B3B',
  'Sewerage': '#8B5CF6',
  'Sewerage System': '#8B5CF6',
  'Safety': '#FF3B3B',
  'Safety Concern': '#FF3B3B',
  'Street Lighting': '#FFB800',
  'Civic Issue': '#00D4FF',
};

const statusLabels: Record<string, { bg: string; color: string }> = {
  reported: { bg: 'rgba(255,184,0,0.12)', color: '#FFB800' },
  inprogress: { bg: 'rgba(0,212,255,0.12)', color: '#00D4FF' },
  resolved: { bg: 'rgba(0,200,150,0.12)', color: '#00C896' },
  emergency: { bg: 'rgba(255,180,171,0.12)', color: '#ffb4ab' },
  flagged: { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
};

export function AdminHeatmap({ reports }: { reports: AdminReport[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Karachi
    const map = L.map(mapRef.current, {
      center: [24.8607, 67.0011],
      zoom: 11,
      zoomControl: false,
    });

    // CartoDB Dark Matter tiles for premium dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB © OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Position zoom controls on right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Clear all existing layers except tile layer
    map.eachLayer((layer) => {
      if (!(layer as any)._url) map.removeLayer(layer);
    });

    // Re-add tile layer (it was removed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB © OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Build heatmap data from reports with coordinates
    const heatPoints: [number, number, number][] = [];
    const reportsWithCoords = reports.filter((r) => r.latitude && r.longitude);

    reportsWithCoords.forEach((report) => {
      const intensity = report.priority === 10 ? 1.0 : report.status === 'emergency' ? 0.9 : 0.5;
      heatPoints.push([report.latitude!, report.longitude!, intensity]);
    });

    // Add heatmap layer if available
    if (heatPoints.length > 0 && typeof (L as any).heatLayer === 'function') {
      (L as any).heatLayer(heatPoints, {
        radius: 30,
        blur: 20,
        maxZoom: 15,
        gradient: {
          0.2: T.bg,
          0.4: '#00D4FF',
          0.6: '#FFB800',
          0.8: '#FF6B35',
          1.0: '#FF3B3B',
        },
      }).addTo(map);
    }

    // Add individual markers
    reportsWithCoords.forEach((report) => {
      const color = categoryColors[report.category] || '#00D4FF';
      const statusStyle = statusLabels[report.status] || statusLabels.reported;

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 14px; height: 14px; border-radius: 50%;
            background: ${color}; border: 2px solid ${T.bg};
            box-shadow: 0 0 10px ${color}44;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([report.latitude!, report.longitude!], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="background:${T.surface};border:1px solid rgba(168,232,255,0.12);border-radius:12px;padding:12px 14px;min-width:220px;color:${T.onSurface};font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${report.title}</div>
          <div style="color:${T.muted};font-size:11px;margin-bottom:8px;">${report.location} · ${report.district}</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${statusStyle.bg};color:${statusStyle.color};">${report.status}</span>
            <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${color}14;color:${color};">${report.category}</span>
          </div>
          ${report.assignedTo ? `<div style="color:${T.muted};font-size:10px;margin-top:6px;">Assigned: ${report.assignedTo}</div>` : ''}
        </div>
      `, {
        className: 'admin-heatmap-popup',
        closeButton: false,
      });
    });
  }, [reports]);

  return (
    <div className="space-y-4">
      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4" style={glassCard}>
        <span style={{ color: T.onSurface, fontWeight: 700, fontSize: 14, fontFamily: T.fontHeadline }}>Heatmap Legend</span>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(categoryColors)
            .filter(([key]) => !key.includes(' ') || ['Road Infrastructure', 'Water Supply', 'Gas Leak', 'Waste Management', 'Safety Concern', 'Street Lighting', 'Civic Issue'].includes(key))
            .slice(0, 7)
            .map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}44` }} />
                <span style={{ color: T.muted, fontSize: 11, fontFamily: T.fontHeadline }}>{name}</span>
              </div>
            ))}
        </div>
        <span style={{ color: T.muted, fontSize: 11, marginLeft: 'auto', fontFamily: T.fontData }}>
          {reports.filter((r) => r.latitude && r.longitude).length} pinned reports
        </span>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="rounded-xl overflow-hidden"
        style={{
          height: 'calc(100vh - 220px)',
          minHeight: 500,
          border: `1px solid ${T.border}`,
        }}
      />

      {/* Custom popup styles */}
      <style>{`
        .admin-heatmap-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 12px !important;
        }
        .admin-heatmap-popup .leaflet-popup-tip {
          background: ${T.surface} !important;
          border: 1px solid rgba(168,232,255,0.12) !important;
        }
        .admin-heatmap-popup .leaflet-popup-content {
          margin: 0 !important;
        }
      `}</style>
    </div>
  );
}
