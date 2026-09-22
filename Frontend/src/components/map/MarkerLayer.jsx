import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import DestinationMarker from './DestinationMarker';
import { useMapStore } from '../../store/mapStore';
import { createStayMarkerIcon, createActivityMarkerIcon } from '../../utils/mapHelpers';
import { MdStar, MdHotel, MdSportsKabaddi, MdSelfImprovement } from 'react-icons/md';

const isValidLatLng = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat >= 28 && lat <= 32 && lng >= 77 && lng <= 82;
};

export default function MarkerLayer() {
  const { 
    layers = { destinations: true, stays: true, activities: true, spiritual: true }, 
    selectedCategory, 
    allDestinations = [], 
    allStays = [], 
    allActivities = [], 
    allSpiritual = [],
    selectedDestination 
  } = useMapStore();

  const filteredDestinations = allDestinations.filter((dest) => {
    if (selectedCategory === 'all') return true;
    return dest.category === selectedCategory;
  });

  return (
    <>
      {/* Destinations Layer */}
      {layers.destinations &&
        filteredDestinations.map((dest) => {
          const destId = dest.id || dest._id || dest.slug;
          return <DestinationMarker key={`dest-${destId}`} destination={dest} />;
        })}

      {/* Real Stays Layer from MongoDB / mapStore */}
      {layers.stays &&
        allStays.map((stay) => {
          const coords = stay.coordinates || (
            stay.location?.coordinates && stay.location.coordinates.length === 2
              ? [stay.location.coordinates[1], stay.location.coordinates[0]]
              : null
          );
          if (!isValidLatLng(coords)) return null;

          const stayId = stay.id || stay._id || stay.slug;
          const isApprox = stay.locationSource && stay.locationSource.startsWith('APPROXIMATE');
          const isKmvn = stay.name?.includes('KMVN') || stay.category?.includes('Government');
          const imgSrc = stay.image?.url || stay.image || (Array.isArray(stay.images) && stay.images[0]?.url) || (isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg');
          const isSelected = selectedDestination && (selectedDestination.id === stayId || selectedDestination._id === stayId);

          let formattedPrice = '₹1,200';
          if (typeof stay.price === 'object' && stay.price?.amount) {
            formattedPrice = `₹${stay.price.amount.toLocaleString('en-IN')}`;
          } else if (stay.pricePerNight) {
            formattedPrice = typeof stay.pricePerNight === 'number' ? `₹${stay.pricePerNight.toLocaleString('en-IN')}` : stay.pricePerNight;
          } else if (typeof stay.price === 'number') {
            formattedPrice = `₹${stay.price.toLocaleString('en-IN')}`;
          }

          return (
            <Marker
              key={`stay-${stayId}`}
              position={coords}
              icon={createStayMarkerIcon(stay, isSelected)}
            >
              <Popup className="custom-leaflet-popup" closeButton={false}>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl w-64 border border-slate-700 shadow-xl">
                  <div className="w-full h-24 overflow-hidden rounded-lg mb-2 bg-slate-800">
                    <img
                      src={imgSrc}
                      alt={stay.name}
                      onError={(e) => { e.target.src = isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg'; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold uppercase">
                    <MdHotel /> {stay.category || stay.type || 'Tourist Rest House'}
                  </div>
                  <h4 className="font-bold text-xs text-white m-0 mt-0.5 leading-tight">{stay.name}</h4>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                    {stay.city ? `${stay.city}${stay.district ? `, ${stay.district}` : ''}` : stay.district || 'Uttarakhand'}
                  </p>

                  {/* Honest Approximate Location Badge */}
                  {isApprox && (
                    <div className="text-[10px] text-amber-300 bg-amber-950/80 border border-amber-500/40 rounded px-1.5 py-0.5 mt-1.5 font-medium flex items-center gap-1">
                      <span>Location approximate — town/village centre</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      {formattedPrice}
                    </span>
                    {stay.rating && stay.rating > 0 && (
                      <span className="text-[10px] flex items-center gap-0.5 text-amber-400 font-bold">
                        <MdStar /> {stay.rating}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Real Activities Layer from MongoDB / mapStore */}
      {layers.activities &&
        allActivities.map((act) => {
          const coords = act.coordinates || (
            act.location?.coordinates && act.location.coordinates.length === 2
              ? [act.location.coordinates[1], act.location.coordinates[0]]
              : null
          );
          if (!isValidLatLng(coords)) return null;

          const actId = act.id || act._id || act.slug;
          const isSelected = selectedDestination && (selectedDestination.id === actId || selectedDestination._id === actId);

          return (
            <Marker
              key={`act-${actId}`}
              position={coords}
              icon={createActivityMarkerIcon(act, isSelected)}
            >
              <Popup className="custom-leaflet-popup" closeButton={false}>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl w-60 border border-slate-700 shadow-xl">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase">
                    <MdSportsKabaddi /> {act.category || 'Adventure'}
                  </div>
                  <h4 className="font-bold text-xs text-white m-0 mt-1 leading-tight">{act.name}</h4>
                  <p className="text-[11px] text-slate-300 mt-1 mb-2 leading-tight line-clamp-2">
                    {act.shortDescription || act.description || act.desc || ''}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800">
                    <span>{act.district || 'Uttarakhand'}</span>
                    {act.cost && <span className="text-amber-300 font-bold">{act.cost}</span>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Real Spiritual Sites Layer from MongoDB / mapStore */}
      {layers.spiritual &&
        allSpiritual.map((site) => {
          const coords = site.coordinates || (
            site.location?.coordinates && site.location.coordinates.length === 2
              ? [site.location.coordinates[1], site.location.coordinates[0]]
              : null
          );
          if (!isValidLatLng(coords)) return null;

          const siteId = site.id || site._id || site.slug;
          const isSelected = selectedDestination && (selectedDestination.id === siteId || selectedDestination._id === siteId);

          return (
            <Marker
              key={`spir-${siteId}`}
              position={coords}
              icon={createActivityMarkerIcon(site, isSelected)}
            >
              <Popup className="custom-leaflet-popup" closeButton={false}>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl w-56 border border-amber-500/40 shadow-xl">
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase">
                    <MdSelfImprovement /> {site.category || 'Spiritual Dham'}
                  </div>
                  <h4 className="font-bold text-xs text-white m-0 mt-0.5 leading-tight">{site.name}</h4>
                  <p className="text-[11px] text-slate-300 mt-1 m-0 line-clamp-2">
                    {site.shortDescription || site.description || site.importance || ''}
                  </p>
                  {site.altitude && (
                    <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                      Elevation: {site.altitude}m
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
}
