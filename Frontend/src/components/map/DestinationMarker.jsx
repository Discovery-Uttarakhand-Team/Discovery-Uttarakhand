import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { createCustomMarkerIcon } from '../../utils/mapHelpers';
import DestinationPopup from './DestinationPopup';
import { useMapStore } from '../../store/mapStore';

export default function DestinationMarker({ destination }) {
  const { selectedDestination, setSelectedDestination } = useMapStore();
  const isSelected = (selectedDestination?._id || selectedDestination?.id) === (destination._id || destination.id);

  const icon = createCustomMarkerIcon(destination, isSelected);

  const pos = destination.coordinates || 
    (destination.location?.coordinates && [destination.location.coordinates[1], destination.location.coordinates[0]]);

  if (!pos || !Array.isArray(pos) || pos.length !== 2 || isNaN(pos[0]) || isNaN(pos[1])) return null;

  return (
    <Marker
      position={pos}
      icon={icon}
      eventHandlers={{
        click: () => {
          setSelectedDestination(destination);
        }
      }}
    >
      <Popup className="custom-leaflet-popup" closeButton={false} offset={[0, -14]}>
        <DestinationPopup destination={destination} />
      </Popup>
    </Marker>
  );
}
