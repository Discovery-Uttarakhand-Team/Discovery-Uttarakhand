import L from 'leaflet';

export const getCategoryColor = (category) => {
  switch (category) {
    case 'spiritual':
      return '#f59e0b'; // Amber / Saffron
    case 'trekking':
      return '#ec4899'; // Pink / Rose
    case 'adventure':
      return '#0ea5e9'; // Sky Blue
    case 'hill_station':
      return '#10b981'; // Emerald
    case 'wildlife':
      return '#8b5cf6'; // Violet
    default:
      return '#6366f1'; // Indigo
  }
};

export const getCategoryIconSvg = (category) => {
  switch (category) {
    case 'spiritual':
      // Lotus / Temple icon
      return `<path fill="currentColor" d="M12 2C10 5 8 9 8 13c0 3 2 5 4 5s4-2 4-5c0-4-2-8-4-11zm-5.5 8C4.5 13 4 16 6 18c1.5 1.5 3.5 1 4.5.5-1-2.5-1.5-5.5-4-8.5zm11 0c-2.5 3-3 6-4 8.5 1 .5 3 1 4.5-.5 2-2 1.5-5-.5-8zM12 20c-3 0-6 .5-8 2h16c-2-1.5-5-2-8-2z"/>`;
    case 'trekking':
      // Mountain peak
      return `<path fill="currentColor" d="m14 6-4.2 6.3L8 9.5 3 17h18L14 6zm0 3.7L16.8 14H11.2L14 9.7z"/>`;
    case 'adventure':
      // Compass / wave
      return `<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15-5-2 2-5 5 2-2 5z"/>`;
    case 'hill_station':
      // Pine tree / hill
      return `<path fill="currentColor" d="M12 3 5 15h3.5v5h7v-5H19L12 3zm0 4.2L15 13H9l3-5.8z"/>`;
    case 'wildlife':
      // Paw / Leaf
      return `<path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 2c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm14 0c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-7 3c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z"/>`;
    default:
      return `<path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`;
  }
};

export const createCustomMarkerIcon = (destination, isSelected = false) => {
  const color = getCategoryColor(destination.category);
  const iconSvg = getCategoryIconSvg(destination.category);
  const size = isSelected ? 48 : 38;
  const altitudeFormatted = destination.altitude ? `${destination.altitude}m` : '';

  const html = `
    <div class="custom-marker-wrapper ${isSelected ? 'marker-selected' : ''}" style="width: ${size}px; height: ${size}px;">
      ${isSelected ? `<div class="marker-pulse" style="border-color: ${color};"></div>` : ''}
      <div class="custom-marker-pin" style="background: ${color}; box-shadow: 0 4px 14px ${color}80;">
        <svg viewBox="0 0 24 24" width="${isSelected ? 24 : 18}" height="${isSelected ? 24 : 18}">
          ${iconSvg}
        </svg>
      </div>
      <div class="custom-marker-tag" style="background: rgba(15, 23, 42, 0.85); color: #fff; border-color: ${color};">
        <span class="font-medium">${destination.name}</span>
        ${altitudeFormatted ? `<span class="marker-alt">${altitudeFormatted}</span>` : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export const createStayMarkerIcon = (stay, isSelected = false) => {
  const size = isSelected ? 40 : 32;
  const html = `
    <div class="custom-stay-pin ${isSelected ? 'marker-selected' : ''}">
      <div class="stay-inner">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-stay-marker',
    html: html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const createActivityMarkerIcon = (activity, isSelected = false) => {
  const size = isSelected ? 40 : 32;
  const html = `
    <div class="custom-activity-pin ${isSelected ? 'marker-selected' : ''}">
      <div class="activity-inner">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-activity-marker',
    html: html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};
