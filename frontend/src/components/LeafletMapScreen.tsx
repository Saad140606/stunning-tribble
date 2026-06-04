import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { apiFetch } from '../services/api';
import 'leaflet/dist/leaflet.css';
import { Heart, Eye, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Report, User } from '../App';
import { translations } from './translations';
import { getDistrictCenter, generateRandomCoordinates } from '../utils/mapConfig';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapScreenProps {
  reports: Report[];
  user: User;
  onReportSelect: (report: Report) => void;
  onUpvote: (reportId: string) => void;
}

type FilterType = 'all' | 'pothole' | 'garbage' | 'water' | 'safety' | 'streetlight';

const categoryColors: Record<string, string> = {
  pothole: '#FF6B35',
  road: '#FF6B35',
  garbage: '#00C896',
  streetlight: '#FFB800',
  water: '#00D4FF',
  sewerage: '#8B5CF6',
  safety: '#FF3B3B',
};

export function LeafletMapScreen({ reports, user, onReportSelect, onUpvote }: LeafletMapScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedPin, setSelectedPin] = useState<Report | null>(null);
  const [reportCoordinates, setReportCoordinates] = useState<Map<string, [number, number]>>(new Map());
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const heatLayerRef = useRef<any>(null);

  const t = translations[user.language];

  const filterOptions: { value: FilterType; label: string; color: string }[] = [
    { value: 'all', label: t.filterAll, color: '#00D4FF' },
    { value: 'pothole', label: t.pothole, color: '#FF6B35' },
    { value: 'garbage', label: t.garbage, color: '#00C896' },
    { value: 'water', label: t.water, color: '#00D4FF' },
    { value: 'streetlight', label: t.streetlight, color: '#FFB800' },
    { value: 'safety', label: t.safety, color: '#FF3B3B' },
  ];

  const getStatusStyle = (status: Report['status']) => {
    switch (status) {
      case 'reported': return { bg: 'rgba(255,107,53,0.15)', color: '#FF6B35', text: t.statusReported };
      case 'inprogress': return { bg: 'rgba(255,184,0,0.15)', color: '#FFB800', text: t.statusInProgress };
      case 'resolved': return { bg: 'rgba(0,200,150,0.15)', color: '#00C896', text: t.statusResolved };
      case 'emergency': return { bg: 'rgba(255,59,59,0.18)', color: '#FF3B3B', text: t.statusEmergency };
      case 'flagged': return { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6', text: t.statusFlagged };
      default: return { bg: 'rgba(0,212,255,0.1)', color: '#8BA3C7', text: status };
    }
  };

  const shouldShowAllKarachi = user.district === 'Karachi';
  const filteredReports = reports
    .filter(report => shouldShowAllKarachi || report.district === user.district)
    .filter(report => {
      if (selectedFilter === 'all') return true;
      return report.type.toLowerCase() === selectedFilter;
    });

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return `${diffMins} ${t.minutesAgo}`;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    return `${diffDays} ${t.daysAgo}`;
  };

  // Generate stable coordinates
  useEffect(() => {
    const districtCenter = getDistrictCenter(user.district);
    const newCoordinates = new Map<string, [number, number]>();
    const districtReports = reports.filter(r => shouldShowAllKarachi || r.district === user.district);
    const coordinates = generateRandomCoordinates(districtCenter, districtReports.length, 5);

    districtReports.forEach((report, index) => {
      if (report.coordinates) {
        newCoordinates.set(report.id, [report.coordinates.lng, report.coordinates.lat]);
      } else if (!reportCoordinates.has(report.id)) {
        newCoordinates.set(report.id, coordinates[index] || districtCenter);
      } else {
        newCoordinates.set(report.id, reportCoordinates.get(report.id)!);
      }
    });

    setReportCoordinates(newCoordinates);
  }, [reports, user.district, shouldShowAllKarachi]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const districtCenter = getDistrictCenter(user.district);

    leafletMapRef.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true,
    }).setView([districtCenter[1], districtCenter[0]], 12);

    leafletMapRef.current.zoomControl.setPosition('topright');

    // CartoDB Dark Matter tiles
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
      attribution: '© CartoDB © OpenStreetMap contributors'
    }).addTo(leafletMapRef.current);

    // @ts-ignore: leaflet heat plugin adds heatLayer to L
    const heatLayer = (L as any).heatLayer([], { 
      radius: 40, 
      blur: 15, 
      maxZoom: 12,
      minOpacity: 0.35
    });
    heatLayer.addTo(leafletMapRef.current);
    heatLayerRef.current = heatLayer;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        heatLayerRef.current = null;
      }
    };
  }, [user.district]);

  // Update markers and heatmap
  useEffect(() => {
    if (!leafletMapRef.current || reportCoordinates.size === 0) return;

    markersRef.current.forEach(marker => {
      leafletMapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    const heatPoints: [number, number, number][] = [];

    filteredReports.forEach((report) => {
      const coordinates = reportCoordinates.get(report.id);
      if (!coordinates) return;

      const color = categoryColors[report.type] || '#00D4FF';

      // leaflet.heat expects [lat, lng, intensity]
      // coordinates[1] is lat, coordinates[0] is lng
      const intensity = report.priority === 'high' ? 1.0 : (report.priority === 'medium' ? 0.8 : 0.6);
      heatPoints.push([coordinates[1], coordinates[0], intensity]);

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background: #0F2040;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid ${color};
            box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 8px ${color}40;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
            position: relative;
          ">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color};"></div>
            ${report.priority === 'high' ? `
              <div style="
                position: absolute; top: -3px; right: -3px;
                width: 10px; height: 10px;
                background: #FF3B3B; border-radius: 50%;
                border: 2px solid #0F2040;
              "></div>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([coordinates[1], coordinates[0]], { icon: customIcon })
        .addTo(leafletMapRef.current!);

      marker.on('click', () => {
        setSelectedPin(report);
      });

      markersRef.current.push(marker);
    });

    if (heatLayerRef.current) {
      heatLayerRef.current.setLatLngs(heatPoints);
    }
  }, [filteredReports, reportCoordinates]);

  return (
    <div className="flex flex-col relative" style={{ height: 'calc(100vh - 5rem)', background: '#0A1628' }}>
      {/* Filter Chips */}
      <div
        className="absolute top-3 left-3 right-3 z-30 flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {filterOptions.map((option) => (
          <button
            key={option.value}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
            style={{
              background: selectedFilter === option.value ? option.color : '#0F2040',
              color: selectedFilter === option.value ? '#0A1628' : '#8BA3C7',
              border: `1px solid ${selectedFilter === option.value ? option.color : 'rgba(0,212,255,0.12)'}`,
              boxShadow: selectedFilter === option.value ? `0 2px 8px ${option.color}40` : 'none',
            }}
            onClick={() => setSelectedFilter(option.value)}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: selectedFilter === option.value ? '#0A1628' : option.color }}
            />
            {option.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative flex-1 z-10">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />

        {/* Issues count pill */}
        <div
          className="absolute bottom-4 left-4 px-3 py-2 rounded-xl text-sm font-medium z-20"
          style={{
            background: '#0F2040',
            border: '1px solid rgba(0,212,255,0.15)',
            color: '#F0F4FF',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ color: '#00D4FF', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{filteredReports.length}</span>
          {' '}{t.issuesNearby}
        </div>
      </div>

      {/* Bottom Sheet for Selected Pin */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto rounded-t-2xl z-[10000]"
            style={{
              background: '#0F2040',
              borderTop: '1px solid rgba(0,212,255,0.15)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,212,255,0.2)' }} />
            </div>

            <div className="px-4 pb-6 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate" style={{ fontSize: '16px', fontWeight: 600, color: '#F0F4FF' }}>
                    {selectedPin.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#4A6080', marginTop: '2px' }}>
                    {selectedPin.ward} • {formatTimeAgo(selectedPin.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPin(null)}
                  className="p-1.5 rounded-lg ml-2"
                  style={{ background: 'rgba(0,212,255,0.08)' }}
                >
                  <X className="w-4 h-4" style={{ color: '#8BA3C7' }} />
                </button>
              </div>

              {/* Status */}
              {(() => {
                const s = getStatusStyle(selectedPin.status);
                return (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
                    {s.text}
                  </span>
                );
              })()}

              {/* Description */}
              <p className="line-clamp-2" style={{ fontSize: '13px', color: '#8BA3C7' }}>
                {selectedPin.description}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
                  style={{
                    background: 'rgba(0,212,255,0.08)',
                    color: '#00D4FF',
                    border: '1px solid rgba(0,212,255,0.15)',
                  }}
                  onClick={() => { onReportSelect(selectedPin); setSelectedPin(null); }}
                >
                  <Eye className="w-4 h-4" />
                  {t.viewDetails}
                </button>
                <motion.button
                  className="py-2.5 px-4 rounded-xl flex items-center gap-2 text-sm"
                  style={{
                    background: selectedPin.hasUserUpvoted ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                    color: selectedPin.hasUserUpvoted ? '#00D4FF' : '#4A6080',
                    border: '1px solid rgba(0,212,255,0.1)',
                  }}
                  onClick={() => onUpvote(selectedPin.id)}
                  whileTap={{ scale: 1.05 }}
                >
                  <Heart className="w-4 h-4" fill={selectedPin.hasUserUpvoted ? '#00D4FF' : 'none'} />
                  <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{selectedPin.upvotes}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
