import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { createCustomMarkerIcon } from '../../utils/mapHelpers';
import DestinationPopup from './DestinationPopup';
import { useMapStore } from '../../store/mapStore';

export default function DestinationMarker({ destination }) {
  const { selectedDestination, setSelectedDestination } = useMapStore();
  const isSelected = selectedDestination?.id === destination.id;

  const icon = createCustomMarkerIcon(destination, isSelected);

  return (
    <Marker
      position={destination.coordinates}
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
