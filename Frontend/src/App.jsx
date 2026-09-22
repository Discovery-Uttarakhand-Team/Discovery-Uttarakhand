import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Rentals from './pages/Rentals';
import Stays from './pages/Stays';
import Spiritual from './pages/Spiritual';
import Culture from './pages/Culture';
import Activities from './pages/Activities';
import Guides from './pages/Guides';
import MapPage from './pages/Map';
import TripPlanner from './pages/TripPlanner';
import MyTripPage from './pages/MyTripPage';
import DestinationDetails from './pages/DestinationDetails';
import GuideProfilePage from './pages/GuideProfilePage';
import DetailPage from './pages/DetailPage';
import CopilotPage from './pages/CopilotPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminManagement from './pages/AdminManagement';
import VerificationProofPage from './pages/VerificationProofPage';
import PartnerDashboardPage from './pages/partner/PartnerDashboardPage';
import GlobalAiCopilotLauncher from './components/copilot/GlobalAiCopilotLauncher';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <Router>
              <AuthModal />
              <GlobalAiCopilotLauncher />
              <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/stays" element={<Stays />} />
            <Route path="/spiritual" element={<Spiritual />} />
            <Route path="/culture" element={<Culture />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:slug" element={<GuideProfilePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/trip-planner" element={<TripPlanner />} />
            <Route path="/copilot" element={<ProtectedRoute><CopilotPage /></ProtectedRoute>} />
            <Route path="/my-trip/:tripId" element={<MyTripPage />} />
            <Route path="/my-trip" element={<MyTripPage />} />
            <Route path="/verify/listing/:id" element={<VerificationProofPage />} />
            <Route path="/verify/vehicle/:vehicleNumber" element={<VerificationProofPage />} />
            <Route path="/destinations/:slug" element={<DestinationDetails />} />
            <Route path="/:category/:slug" element={<DetailPage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/partner" element={
              <ProtectedRoute partnerOnly={true}>
                <PartnerDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/partner/:tab" element={
              <ProtectedRoute partnerOnly={true}>
                <PartnerDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/partner/*" element={
              <ProtectedRoute partnerOnly={true}>
                <PartnerDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/:type" element={
              <ProtectedRoute adminOnly={true}>
                <AdminManagement />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </FavoritesProvider>
  </AuthProvider>
</ErrorBoundary>
);
}

export default App;
