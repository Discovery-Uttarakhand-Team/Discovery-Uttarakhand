import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, partnerOnly = false }) => {
  const { isAuthenticated, isLoading, currentUser, setAuthModalOpen } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen font-medium text-forest-green">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-cream/40">
        <h2 className="text-2xl font-bold text-forest-green mb-4">Please login to continue.</h2>
        <button 
          onClick={() => setAuthModalOpen(true)}
          className="btn-primary px-6 py-2 rounded-full"
        >
          Login
        </button>
      </div>
    );
  }

  if (adminOnly && currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-cream/40">
        <h2 className="text-2xl font-bold text-red-600 mb-2">403 Forbidden</h2>
        <p className="text-muted-text max-w-md">You do not have administrative permission to access this management console.</p>
        <a href="/" className="mt-6 inline-block btn-primary px-6 py-2 rounded-full text-sm">Return to Home</a>
      </div>
    );
  }

  if (partnerOnly && currentUser?.role !== 'partner' && currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-cream/40">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-2xl font-bold mb-4 shadow-sm">
          🏢
        </div>
        <h2 className="text-2xl font-bold text-forest-green mb-2">Partner Portal Restricted</h2>
        <p className="text-muted-text max-w-md mb-6">
          This portal is reserved for verified business partners, rental fleet operators, stay hosts, and verified guides in Uttarakhand.
        </p>
        <div className="flex items-center gap-4">
          <a href="/profile" className="btn-primary px-6 py-2.5 rounded-full text-sm">
            View Tourist Profile
          </a>
          <a href="/" className="px-6 py-2.5 rounded-full text-sm font-medium border border-gray-300 text-text-dark hover:bg-gray-50">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
