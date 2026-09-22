import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { 
  UTTARAKHAND_CENTER, 
  DEFAULT_ZOOM, 
  MIN_ZOOM, 
  MAX_ZOOM, 
  UTTARAKHAND_BOUNDS, 
  TILE_PROVIDERS 
} from '../../utils/constants';
import MarkerLayer from './MarkerLayer';
import RouteLayer from './RouteLayer';
import MapControls from './MapControls';

// Inner component to handle fly-to animations when store coordinates update
function MapController() {
  const map = useMap();
  const { mapCenter, mapZoom } = useMapStore();

  useEffect(() => {
    if (mapCenter) {
      map.flyTo(mapCenter, mapZoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [mapCenter, mapZoom, map]);

  return null;
}

export default function UttarakhandMap() {
  const { activeTileLayer } = useMapStore();
  const currentTile = TILE_PROVIDERS[activeTileLayer] || TILE_PROVIDERS.voyager;

  return (
    <div className="w-full h-full relative bg-slate-950">
      <MapContainer
        center={UTTARAKHAND_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={UTTARAKHAND_BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={activeTileLayer}
          url={currentTile.url}
          attribution={currentTile.attribution}
        />

        <MapController />
        <MarkerLayer />
        <RouteLayer />
        <MapControls />
      </MapContainer>
    </div>
  );
}
