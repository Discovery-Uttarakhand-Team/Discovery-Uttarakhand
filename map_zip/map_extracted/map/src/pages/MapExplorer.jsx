import React from 'react';
import Header from '../components/layout/Header';
import LeftSidebar from '../components/layout/LeftSidebar';
import MapStage from '../components/map/MapStage';
import PlanTripPanel from '../components/planner/PlanTripPanel';
import BottomTray from '../components/destinations/BottomTray';
import TripPlanner from '../components/planner/TripPlanner';

export default function MapExplorer() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#040813] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. Header Bar */}
      <Header />

      {/* 2. Main Stage Area (Left Sidebar + Center Map + Right Trip Planner) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation & Layers */}
        <LeftSidebar />

        {/* Center Interactive Topographic Map */}
        <MapStage />

        {/* Right AI Trip Planner Panel */}
        <PlanTripPanel />
      </div>

      {/* 3. Bottom Tray: Top Destinations & Circuits */}
      <BottomTray />

      {/* 4. Fullscreen Trip Planner Modal (on click "View Full Itinerary" / "Generate My Trip") */}
      <TripPlanner />
    </div>
  );
}
