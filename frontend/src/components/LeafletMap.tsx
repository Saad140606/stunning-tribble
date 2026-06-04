import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report, User } from '../App';
import { getDistrictCenter, generateRandomCoordinates } from '../utils/mapConfig';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  reports: Report[];
  user: User;
  onReportSelect: (report: Report) => void;
  className?: string;
}

export function LeafletMap({ reports, user, onReportSelect, className }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Get district center coordinates
    const districtCenter = getDistrictCenter(user.district);
    
    // Initialize map
    leafletMapRef.current = L.map(mapRef.current).setView([districtCenter[1], districtCenter[0]], 12);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMapRef.current);

    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [user.district]);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Generate coordinates for reports
    const districtCenter = getDistrictCenter(user.district);
    const reportCoordinates = generateRandomCoordinates(districtCenter, reports.length, 5);

    // Add new markers
    reports.forEach((report, index) => {
      const coordinates = reportCoordinates[index] || districtCenter;
      
      // Create custom icon based on status
      const iconColor = 
        report.status === 'pending' ? 'red' :
        report.status === 'submitted' ? 'orange' : 'green';

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${iconColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">
            📍
          </div>
          ${report.priority === 'high' ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: red; border-radius: 50%; border: 1px solid white;"></div>' : ''}
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      const marker = L.marker([coordinates[1], coordinates[0]], { icon: customIcon })
        .addTo(leafletMapRef.current!);

      // Add popup
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${report.title}</h3>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">${report.ward} • ${report.street}</p>
          <p style="margin: 4px 0; font-size: 12px;">${report.description}</p>
          <div style="margin-top: 8px;">
            <span style="background: ${iconColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
              ${report.status}
            </span>
            <span style="margin-left: 8px; font-size: 10px; color: #888;">
              ${report.aiTag} - ${report.aiConfidence}%
            </span>
          </div>
          <button onclick="window.selectReport('${report.id}')" style="
            margin-top: 8px;
            background: #007cba;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Add click handler
      marker.on('click', () => {
        onReportSelect(report);
      });

      markersRef.current.push(marker);
    });

    // Global function for popup button clicks
    (window as any).selectReport = (reportId: string) => {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        onReportSelect(report);
      }
    };

  }, [reports, user.district, onReportSelect]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className || ''}`}
      style={{ minHeight: '400px' }}
    />
  );
}