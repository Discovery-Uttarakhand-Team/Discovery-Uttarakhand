import React from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/mapStore';
import { UTTARAKHAND_CENTER, DEFAULT_ZOOM } from '../../utils/constants';
import { 
  MdAdd, 
  MdRemove, 
  MdMyLocation, 
  MdCropFree, 
  MdLayers,
  MdViewCarousel
} from 'react-icons/md';

export default function MapControls() {
  const map = useMap();
  const { resetMapBounds, toggleCarousel, isCarouselOpen, setActiveSidebarTab } = useMapStore();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleResetView = () => {
    resetMapBounds();
    map.flyTo(UTTARAKHAND_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 12);
        },
        () => {
          // Fallback to Dehradun Capital
          map.flyTo([30.3165, 78.0322], 12);
        }
      );
    } else {
      map.flyTo([30.3165, 78.0322], 12);
    }
  };

  return (
    <div className="absolute right-4 bottom-24 z-[1000] flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="flex flex-col rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl overflow-hidden divide-y divide-slate-800">
        <button
          onClick={handleZoomIn}
          className="p-3 text-slate-200 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <MdAdd className="text-xl" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-3 text-slate-200 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <MdRemove className="text-xl" />
        </button>
      </div>

      {/* Recenter / Full Extent */}
      <button
        onClick={handleResetView}
        className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 text-slate-200 hover:text-amber-400 hover:bg-slate-800 shadow-2xl transition-all"
        title="Reset to Uttarakhand Overview"
      >
        <MdCropFree className="text-xl" />
      </button>

      {/* Geolocation */}
      <button
        onClick={handleLocateMe}
        className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 text-slate-200 hover:text-amber-400 hover:bg-slate-800 shadow-2xl transition-all"
        title="Current Location"
      >
        <MdMyLocation className="text-xl" />
      </button>

      {/* Quick Switch to Layers Tab */}
      <button
        onClick={() => setActiveSidebarTab('layers')}
        className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 text-slate-200 hover:text-amber-400 hover:bg-slate-800 shadow-2xl transition-all"
        title="Map Layers & Themes"
      >
        <MdLayers className="text-xl" />
      </button>

      {/* Toggle Carousel */}
      <button
        onClick={toggleCarousel}
        className={`p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 transition-all ${
          isCarouselOpen ? 'text-amber-400 bg-slate-800' : 'text-slate-200 hover:text-amber-400 hover:bg-slate-800'
        } shadow-2xl`}
        title="Toggle Discover Carousel"
      >
        <MdViewCarousel className="text-xl" />
      </button>
    </div>
  );
}
