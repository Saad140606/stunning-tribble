// Map configuration for Karachi
export const MAP_CONFIG = {
  defaultCenter: [67.0011, 24.8607] as [number, number], // Karachi [lng, lat]
  defaultZoom: 12,
};

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'Karachi': [67.0011, 24.8607],
  'Saddar': [67.0099, 24.8615],
  'Clifton': [67.0244, 24.8138],
  'Gulshan-e-Iqbal': [67.0935, 24.9230],
  'PECHS': [67.0531, 24.8715],
  'Korangi': [67.1312, 24.8390],
  'Malir': [67.2067, 24.8907],
  'Landhi': [67.1500, 24.8500],
  'Lyari': [66.9875, 24.8480],
  'North Karachi': [67.0558, 24.9710],
  'Federal B Area': [67.0398, 24.9285],
  'DHA': [67.0625, 24.8030],
  'Nazimabad': [67.0310, 24.9125],
  'Gulistan-e-Johar': [67.1254, 24.9100],
  'Orangi': [66.9734, 24.9350],
};

export const getDistrictCenter = (district: string): [number, number] => {
  return DISTRICT_COORDINATES[district] || MAP_CONFIG.defaultCenter;
};

export const createMarkerElement = (report: any) => {
  const el = document.createElement('div');
  el.className = 'custom-marker';

  // Category-based colors
  const categoryColors: Record<string, string> = {
    'pothole': '#FF6B35',
    'road': '#FF6B35',
    'garbage': '#00C896',
    'streetlight': '#FFB800',
    'water': '#00D4FF',
    'sewerage': '#8B5CF6',
    'drainage': '#8B5CF6',
    'safety': '#FF3B3B',
  };

  const color = categoryColors[report.type?.toLowerCase()] || '#00D4FF';

  el.style.cssText = `
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 3px solid ${color};
    background: #0F2040;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 8px ${color}40;
    position: relative;
    transition: transform 0.2s ease;
  `;

  // Priority indicator
  if (report.priority === 'high') {
    const priorityIndicator = document.createElement('div');
    priorityIndicator.style.cssText = `
      position: absolute;
      top: -3px;
      right: -3px;
      width: 12px;
      height: 12px;
      background-color: #FF3B3B;
      border-radius: 50%;
      border: 2px solid #0F2040;
      animation: pulse 2s infinite;
    `;
    el.appendChild(priorityIndicator);
  }

  const icon = document.createElement('div');
  icon.innerHTML = '📍';
  icon.style.cssText = `
    font-size: 16px;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
  `;
  el.appendChild(icon);

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });

  return el;
};

export const generateRandomCoordinates = (center: [number, number], count: number, radiusKm: number = 5): [number, number][] => {
  const coordinates: [number, number][] = [];
  const [centerLng, centerLat] = center;

  for (let i = 0; i < count; i++) {
    const radiusDeg = radiusKm / 111;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDeg;
    const lng = centerLng + (distance * Math.cos(angle));
    const lat = centerLat + (distance * Math.sin(angle));
    coordinates.push([lng, lat]);
  }

  return coordinates;
};