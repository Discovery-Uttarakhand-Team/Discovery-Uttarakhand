import routesData from '../data/routes.json';

export const getAllRoutes = () => {
  return routesData;
};

export const getRouteById = (id) => {
  return routesData.find((r) => r.id === id) || null;
};

export const getRouteCoordinates = (route) => {
  if (!route || !route.waypoints) return [];
  return route.waypoints.map((w) => w.coords);
};
