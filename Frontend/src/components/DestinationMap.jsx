import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on category
const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  destination: createIcon('red'),
  stay: createIcon('blue'),
  rental: createIcon('orange'),
  activity: createIcon('green'),
  guide: createIcon('violet'),
  spiritual: createIcon('gold')
};

// Component to dynamically adjust map view bounds
const MapBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const group = new L.featureGroup(markers.map(m => L.marker(m.position)));
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, map]);
  return null;
};

const DestinationMap = ({ center, items }) => {
  // Center is [lat, lng]
  if (!center || center.length !== 2) {
    return (
      <div className="w-full h-96 bg-beige/30 rounded-3xl flex items-center justify-center border border-border-light">
        <p className="text-muted-text font-medium">Map data unavailable for this location.</p>
      </div>
    );
  }

  // Format items for the map
  const markers = [];
  
  // Add main destination
  markers.push({
    id: 'main',
    position: center,
    type: 'destination',
    title: 'Main Destination',
    popup: 'You are looking at this location.'
  });

  // Process all nearby items
  if (items) {
    ['nearbyDestinations', 'stays', 'rentals', 'activities', 'guides'].forEach(category => {
      if (items[category]) {
        items[category].forEach(item => {
          if (typeof item === 'object' && item.location?.coordinates && item.location.coordinates.length === 2) {
            // GeoJSON coordinates are [lon, lat], Leaflet wants [lat, lon]
            const pos = [item.location.coordinates[1], item.location.coordinates[0]];
            
            // Generate link based on category
            let link = '';
            if (category === 'nearbyDestinations') link = `/destinations/${item.slug}`;
            else if (category === 'stays') link = `/stays/${item.slug}`;
            else if (category === 'rentals') link = `/rentals/${item.slug}`;
            else if (category === 'activities') link = `/activities/${item.slug}`;
            
            // Map our categories to icon types
            let iconType = 'destination';
            if (category === 'stays') iconType = 'stay';
            if (category === 'rentals') iconType = 'rental';
            if (category === 'activities') iconType = 'activity';
            if (category === 'guides') iconType = 'guide';

            markers.push({
              id: item._id || item.id,
              position: pos,
              type: iconType,
              title: item.name || item.businessName,
              image: item.coverImage?.url || item.image?.url || item.image,
              link: link,
              description: item.shortDescription || item.category || item.type,
              distance: item.distance
            });
          }
        });
      }
    });
  }

  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-sm border border-border-light z-0 relative">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, idx) => (
          <Marker 
            key={`${marker.id}-${idx}`} 
            position={marker.position}
            icon={icons[marker.type] || icons.destination}
          >
            <Popup className="custom-popup">
              <div className="flex flex-col gap-2 min-w-[200px]">
                {marker.image && (
                  <img 
                    src={marker.image} 
                    alt={marker.title} 
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                  />
                )}
                <h4 className="font-bold text-text-dark text-base m-0 leading-tight">{marker.title}</h4>
                <p className="text-xs text-muted-text m-0 capitalize">{marker.description}</p>
                {marker.distance !== null && marker.distance !== undefined && (
                   <p className="text-xs text-earth-brown m-0 font-medium">📍 {marker.distance.toFixed(1)} km away</p>
                )}
                {marker.link && (
                  <Link to={marker.link} className="bg-forest-green text-white text-xs font-bold py-1.5 px-3 rounded-full text-center hover:bg-dark-green transition-colors mt-1 block">
                    View Details
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {markers.length > 1 && <MapBounds markers={markers} />}
      </MapContainer>
    </div>
  );
};

export default DestinationMap;
