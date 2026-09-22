import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminStats } from '../api/adminApi';
import { Link } from 'react-router-dom';
import PartnerVerificationQueue from '../components/admin/PartnerVerificationQueue';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { label: 'Destinations', count: stats?.destinations || 0 },
    { label: 'Spiritual', count: stats?.spiritual || 0 },
    { label: 'Culture', count: stats?.culture || 0 },
    { label: 'Activities', count: stats?.activities || 0 },
    { label: 'Rentals', count: stats?.rentals || 0 },
    { label: 'Stays', count: stats?.stays || 0 },
    { label: 'Guides', count: stats?.guides || 0 },
    { label: 'Users', count: stats?.users || 0 },
  ];
  
  const aggregatedStats = [
    { label: 'Bookings', count: stats?.bookingsByStatus ? Object.values(stats.bookingsByStatus).reduce((a, b) => a + b, 0) : 0 },
    { label: 'Reviews', count: stats?.reviewsByStatus ? Object.values(stats.reviewsByStatus).reduce((a, b) => a + b, 0) : 0 },
  ];

  return (
    <div className="pt-32 pb-20 px-4 max-w-[1440px] mx-auto min-h-screen">
      <div className="bg-warm-white rounded-3xl p-8 card-shadow">
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-forest-green">Admin Dashboard</h1>
            <p className="text-muted-text">Welcome back, {currentUser?.name}</p>
          </div>
          <button onClick={logout} className="text-red-500 font-bold hover:underline">
            Logout
          </button>
        </div>

        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statItems.map((item) => (
              <Link to={`/admin/${item.label.toLowerCase()}`} key={item.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-forest-green mb-2">Manage {item.label}</h3>
                  <span className="bg-beige text-forest-green font-bold px-3 py-1 rounded-full text-sm">
                    {item.count}
                  </span>
                </div>
                <p className="text-sm text-muted-text">View, add, edit, and delete {item.label.toLowerCase()}.</p>
              </Link>
            ))}
            
            {aggregatedStats.map((item) => (
              <Link to={`/admin/${item.label.toLowerCase()}`} key={item.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-forest-green mb-2">Manage {item.label}</h3>
                  <span className="bg-beige text-forest-green font-bold px-3 py-1 rounded-full text-sm">
                    {item.count}
                  </span>
                </div>
                <p className="text-sm text-muted-text">View and manage {item.label.toLowerCase()}.</p>
              </Link>
            ))}
          </div>
        )}

        {/* Phase 3: Partner Verification Queue & Audit Logs */}
        <div className="mt-10">
          <PartnerVerificationQueue />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
