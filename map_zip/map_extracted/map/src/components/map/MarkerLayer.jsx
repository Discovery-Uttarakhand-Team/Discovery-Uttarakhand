import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import DestinationMarker from './DestinationMarker';
import { useMapStore } from '../../store/mapStore';
import destinationsData from '../../data/destinations.json';
import staysData from '../../data/stays.json';
import activitiesData from '../../data/activities.json';
import spiritualData from '../../data/spiritual.json';
import { createStayMarkerIcon, createActivityMarkerIcon } from '../../utils/mapHelpers';
import { MdStar, MdHotel, MdSportsKabaddi, MdSelfImprovement } from 'react-icons/md';

export default function MarkerLayer() {
  const { layers, selectedCategory } = useMapStore();

  const filteredDestinations = destinationsData.filter((dest) => {
    if (selectedCategory === 'all') return true;
    return dest.category === selectedCategory;
  });

  return (
    <>
      {/* Destinations Layer */}
      {layers.destinations &&
        filteredDestinations.map((dest) => (
          <DestinationMarker key={dest.id} destination={dest} />
        ))}

      {/* Stays Layer */}
      {layers.stays &&
        staysData.map((stay) => (
          <Marker
            key={stay.id}
            position={stay.coordinates}
            icon={createStayMarkerIcon(stay)}
          >
            <Popup className="custom-leaflet-popup" closeButton={false}>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl w-60 border border-slate-700">
                <img
                  src={stay.image}
                  alt={stay.name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold uppercase">
                  <MdHotel /> {stay.type}
                </div>
                <h4 className="font-bold text-xs text-white m-0 mt-0.5">{stay.name}</h4>
                <p className="text-[11px] text-slate-400 m-0">{stay.location}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    {stay.pricePerNight}
                  </span>
                  <span className="text-[10px] flex items-center gap-0.5 text-amber-400 font-bold">
                    <MdStar /> {stay.rating}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Activities Layer */}
      {layers.activities &&
        activitiesData.map((act) => (
          <Marker
            key={act.id}
            position={act.coordinates}
            icon={createActivityMarkerIcon(act)}
          >
            <Popup className="custom-leaflet-popup" closeButton={false}>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl w-60 border border-slate-700">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <MdSportsKabaddi /> {act.category.toUpperCase()}
                </div>
                <h4 className="font-bold text-xs text-white m-0 mt-1">{act.name}</h4>
                <p className="text-[11px] text-slate-300 mt-1 mb-2 leading-tight">{act.desc}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800">
                  <span>{act.duration}</span>
                  <span className="text-amber-300 font-bold">{act.cost}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Spiritual Sites Layer */}
      {layers.spiritual &&
        spiritualData.flatMap((group) =>
          group.sites.map((site, index) => {
            if (!site.coordinates) return null;
            return (
              <Marker
                key={`${group.id}-${index}`}
                position={site.coordinates}
                icon={createActivityMarkerIcon(site)}
              >
                <Popup className="custom-leaflet-popup" closeButton={false}>
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl w-56 border border-amber-500/40">
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase">
                      <MdSelfImprovement /> {group.name}
                    </div>
                    <h4 className="font-bold text-xs text-white m-0 mt-0.5">{site.name}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 m-0">
                      {site.importance || site.part || site.rivers}
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
          })
        )}
    </>
  );
}
