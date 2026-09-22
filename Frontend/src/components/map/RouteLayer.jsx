import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import routesData from '../../data/routes.json';

export default function RouteLayer() {
  const { layers, activeRoute, setActiveRoute, tripDestinations, customRouteGeometry } = useMapStore();

  if (!layers.routes && !activeRoute && tripDestinations.length < 2) {
    return null;
  }

  // Generate coordinates for user's custom itinerary
  const customTripPositions =
    customRouteGeometry || (tripDestinations.length >= 2
      ? tripDestinations.map((d) => d.coordinates)
      : []);

  return (
    <>
      {/* Preset Mountain Routes */}
      {layers.routes &&
        routesData.map((route) => {
          const positions = route.waypoints.map((w) => w.coords);
          const isSelected = activeRoute?.id === route.id;

          return (
            <Polyline
              key={route.id}
              positions={positions}
              pathOptions={{
                color: isSelected ? '#fbbf24' : route.color || '#3b82f6',
                weight: isSelected ? 6 : 4,
                opacity: isSelected ? 0.95 : 0.65,
                dashArray: isSelected ? undefined : '8, 8',
                lineCap: 'round',
                lineJoin: 'round'
              }}
              eventHandlers={{
                click: () => setActiveRoute(isSelected ? null : route)
              }}
            >
              <Tooltip sticky className="custom-route-tooltip">
                <div className="font-sans text-xs font-bold text-slate-900">
                  {route.name} ({route.distance})
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

      {/* User's Custom Planned Route */}
      {customTripPositions.length >= 2 && (
        <Polyline
          positions={customTripPositions}
          pathOptions={{
            color: '#10b981',
            weight: 5,
            opacity: 0.9,
            dashArray: '10, 6'
          }}
        >
          <Tooltip sticky>
            <div className="font-sans text-xs font-bold text-emerald-900">
              Your Custom Planned Road Trip ({tripDestinations.length} stops)
            </div>
          </Tooltip>
        </Polyline>
      )}
    </>
  );
}
