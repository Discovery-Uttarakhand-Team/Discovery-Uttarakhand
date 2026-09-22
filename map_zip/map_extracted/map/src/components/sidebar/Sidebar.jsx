import React from 'react';
import { useMapStore } from '../../store/mapStore';
import SidebarItem from './SidebarItem';
import LayerControls from './LayerControls';
import { CATEGORIES } from '../../utils/constants';
import routesData from '../../data/routes.json';
import spiritualData from '../../data/spiritual.json';
import destinationsData from '../../data/destinations.json';
import { 
  MdExplore, 
  MdAltRoute, 
  MdMap, 
  MdSelfImprovement, 
  MdLuggage, 
  MdChevronLeft, 
  MdChevronRight,
  MdStar,
  MdTerrain,
  MdClose,
  MdDeleteOutline,
  MdNavigation
} from 'react-icons/md';
import { calculateItineraryStats } from '../../utils/routeHelpers';

export default function Sidebar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    activeSidebarTab,
    setActiveSidebarTab,
    selectedCategory,
    setSelectedCategory,
    selectedDestination,
    setSelectedDestination,
    activeRoute,
    setActiveRoute,
    tripDestinations,
    removeTripDestination,
    clearTrip,
    toggleTripPlanner
  } = useMapStore();

  const tripStats = calculateItineraryStats(tripDestinations);

  const filteredDestinations = destinationsData.filter(
    (d) => selectedCategory === 'all' || d.category === selectedCategory
  );

  return (
    <>
      {/* Floating Expand Button when Sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-[1000] p-3 rounded-2xl bg-slate-900/90 text-amber-400 border border-slate-700/80 shadow-2xl backdrop-blur-md hover:bg-slate-800 transition-all hover:scale-105"
          title="Expand Sidebar"
        >
          <MdChevronRight className="text-2xl" />
        </button>
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full z-[1000] transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'w-88 md:w-96 translate-x-0' : '-translate-x-full w-0'
        } bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 text-slate-100 shadow-2xl overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="p-4 pb-3 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <MdTerrain className="text-2xl text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-tight text-white m-0">Devbhoomi</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  GIS
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">Uttarakhand Map Explorer</p>
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
            title="Collapse Sidebar"
          >
            <MdChevronLeft className="text-xl" />
          </button>
        </div>

        {/* Primary Tab Navigation */}
        <div className="px-3 pt-3 pb-2 border-b border-slate-800/60 grid grid-cols-5 gap-1">
          <SidebarItem
            id="explore"
            label="Explore"
            icon={MdExplore}
            isActive={activeSidebarTab === 'explore'}
            onClick={() => setActiveSidebarTab('explore')}
          />
          <SidebarItem
            id="routes"
            label="Routes"
            icon={MdAltRoute}
            isActive={activeSidebarTab === 'routes'}
            onClick={() => setActiveSidebarTab('routes')}
          />
          <SidebarItem
            id="planner"
            label="Plan"
            icon={MdLuggage}
            count={tripDestinations.length}
            isActive={activeSidebarTab === 'planner'}
            onClick={() => setActiveSidebarTab('planner')}
          />
          <SidebarItem
            id="spiritual"
            label="Sacred"
            icon={MdSelfImprovement}
            isActive={activeSidebarTab === 'spiritual'}
            onClick={() => setActiveSidebarTab('spiritual')}
          />
          <SidebarItem
            id="layers"
            label="Layers"
            icon={MdMap}
            isActive={activeSidebarTab === 'layers'}
            onClick={() => setActiveSidebarTab('layers')}
          />
        </div>

        {/* Dynamic Body Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
          {/* TAB 1: EXPLORE */}
          {activeSidebarTab === 'explore' && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Destinations by Category
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Destinations ({filteredDestinations.length})</span>
                </div>

                <div className="space-y-1.5">
                  {filteredDestinations.map((dest) => {
                    const isSelected = selectedDestination?.id === dest.id;
                    return (
                      <div
                        key={dest.id}
                        onClick={() => setSelectedDestination(dest)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-3 border ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-100 truncate m-0">
                              {dest.name}
                            </h4>
                            <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-bold">
                              <MdStar className="text-xs" /> {dest.rating}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate m-0">
                            {dest.district} &bull; {dest.altitude}m
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300/90 font-medium">
                            {dest.bestSeason}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCENIC ROUTES */}
          {activeSidebarTab === 'routes' && (
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Scenic Mountain Highways & Treks
              </span>
              {routesData.map((route) => {
                const isActive = activeRoute?.id === route.id;
                return (
                  <div
                    key={route.id}
                    onClick={() => setActiveRoute(isActive ? null : route)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-100 m-0 leading-tight">
                        {route.name}
                      </h4>
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                        style={{ background: route.color }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 mb-2 line-clamp-2">
                      {route.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/90">
                        {route.distance}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/90">
                        {route.duration}
                      </span>
                    </div>

                    {isActive && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                        <span className="font-semibold text-amber-400 block mb-1">
                          Key Waypoints:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {route.waypoints.map((wp, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                            >
                              {wp.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: TRIP PLANNER */}
          {activeSidebarTab === 'planner' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Custom Itinerary ({tripDestinations.length})
                </span>
                {tripDestinations.length > 0 && (
                  <button
                    onClick={clearTrip}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <MdDeleteOutline /> Clear
                  </button>
                )}
              </div>

              {tripDestinations.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
                  <MdLuggage className="text-3xl text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 m-0">No stops in your itinerary yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Browse destinations and click "+ Add to Trip" or launch preset tours.
                  </p>
                  <button
                    onClick={() => toggleTripPlanner(true)}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
                  >
                    Browse Preset Packages
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Trip Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Est. Distance
                      </span>
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        {tripStats.totalDistanceKm} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Est. Drive Time
                      </span>
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        {tripStats.estimatedTime}
                      </span>
                    </div>
                  </div>

                  {/* Waypoint list */}
                  <div className="space-y-2">
                    {tripDestinations.map((dest, idx) => (
                      <div
                        key={dest.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-slate-200 truncate m-0">
                              {dest.name}
                            </h5>
                            <span className="text-[10px] text-slate-400">{dest.district}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeTripDestination(dest.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Remove stop"
                        >
                          <MdClose className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => toggleTripPlanner(true)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                  >
                    <MdNavigation /> View Full Day-by-Day Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SPIRITUAL SITES */}
          {activeSidebarTab === 'spiritual' && (
            <div className="space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Sacred Pilgrimages & Confluences
              </span>

              {spiritualData.map((group) => (
                <div key={group.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <h4 className="text-xs font-bold text-amber-400 m-0 mb-1">{group.name}</h4>
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{group.description}</p>

                  <div className="space-y-1.5">
                    {group.sites.map((site, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (site.coordinates) {
                            useMapStore.getState().setMapCenter(site.coordinates, 11);
                          }
                        }}
                        className="p-1.5 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-200">{site.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {site.altitude ? `${site.altitude}m` : site.rivers || site.deity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: GIS LAYERS & MAP STYLES */}
          {activeSidebarTab === 'layers' && <LayerControls />}
        </div>

        {/* Footer Statistics */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>13 Himalayan Districts</span>
          <span className="text-amber-400 font-semibold">Devbhoomi Edition</span>
        </div>
      </aside>
    </>
  );
}
