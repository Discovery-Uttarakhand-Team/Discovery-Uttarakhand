import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MapExplorer from './pages/MapExplorer';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapExplorer />} />
        <Route path="/explore" element={<MapExplorer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
