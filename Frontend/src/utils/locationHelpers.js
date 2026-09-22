/**
 * Discovery Uttarakhand - Location Normalization Helpers
 * Converts string, object, or legacy location structures into safe primitive strings.
 * Prevents [object Object] and React child render crashes.
 */

export function normalizeLocationValue(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    // Preferred resolution order: name -> title -> label -> destinationName -> slug
    const resolved = val.name || val.title || val.label || val.destinationName || val.slug || '';
    if (typeof resolved === 'string') return resolved.trim();
    if (typeof resolved === 'object' && resolved !== null) {
      return normalizeLocationValue(resolved);
    }
  }
  return String(val || '').trim();
}

export function getLocationCoordinates(val) {
  if (!val || typeof val !== 'object') return null;
  if (Array.isArray(val.coordinates) && val.coordinates.length === 2) {
    return val.coordinates;
  }
  if (val.location && Array.isArray(val.location.coordinates) && val.location.coordinates.length === 2) {
    // GeoJSON is [lng, lat] -> convert to [lat, lng] for UI if needed or return as-is
    return [val.location.coordinates[1], val.location.coordinates[0]];
  }
  if (val.latitude && val.longitude) {
    return [Number(val.latitude), Number(val.longitude)];
  }
  return null;
}
