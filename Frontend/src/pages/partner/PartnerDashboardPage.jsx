import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getMyPartnerProfile, 
  updateMyPartnerProfile,
  getPartnerDashboardStats, 
  getMyListings, 
  createListingDraft, 
  updateListing, 
  deletePartnerListing,
  submitListingForVerification,
  getPartnerBookings, 
  updatePartnerBookingStatus, 
  getPartnerAvailability, 
  updatePartnerAvailability, 
  updateListingPricing, 
  getPartnerEarnings, 
  getPartnerExpenses, 
  createPartnerExpense, 
  deletePartnerExpense, 
  getPartnerAnalytics, 
  getPartnerReviews, 
  replyToPartnerReview 
} from '../../api/partnerApi';
import PartnerSidebar from '../../components/partner/PartnerSidebar';
import PartnerHeader from '../../components/partner/PartnerHeader';
import OverviewTab from '../../components/partner/tabs/OverviewTab';
import ListingsTab from '../../components/partner/tabs/ListingsTab';
import ListingFormTab from '../../components/partner/tabs/ListingFormTab';
import BookingsTab from '../../components/partner/tabs/BookingsTab';
import AvailabilityTab from '../../components/partner/tabs/AvailabilityTab';
import PricingTab from '../../components/partner/tabs/PricingTab';
import EarningsTab from '../../components/partner/tabs/EarningsTab';
import ExpensesTab from '../../components/partner/tabs/ExpensesTab';
import AnalyticsTab from '../../components/partner/tabs/AnalyticsTab';
import ReviewsTab from '../../components/partner/tabs/ReviewsTab';
import ProfileTab from '../../components/partner/tabs/ProfileTab';
import { Loader2, AlertCircle } from 'lucide-react';

const validTabs = [
  'overview', 'listings', 'add-listing', 'bookings',
  'availability', 'pricing', 'earnings', 'expenses',
  'analytics', 'reviews', 'profile'
];

const PartnerDashboardPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = (tab && validTabs.includes(tab)) ? tab : 'overview';

  const handleTabChange = (newTab) => {
    if (newTab === 'add-listing') {
      setEditingListing(null);
    }
    navigate(`/partner/${newTab}`);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Core Data States
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);

  // Form State for Editing Listing
  const [editingListing, setEditingListing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all partner data in parallel
  const loadPartnerData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [
        profileRes,
        statsRes,
        listingsRes,
        bookingsRes,
        earningsRes,
        expensesRes,
        analyticsRes,
        reviewsRes
      ] = await Promise.all([
        getMyPartnerProfile(),
        getPartnerDashboardStats(),
        getMyListings(),
        getPartnerBookings(),
        getPartnerEarnings(),
        getPartnerExpenses(),
        getPartnerAnalytics(),
        getPartnerReviews()
      ]);

      if (profileRes?.success) setPartnerProfile(profileRes.partner || profileRes.data);
      if (statsRes?.success) setDashboardStats(statsRes.stats || statsRes.data);
      if (listingsRes?.success) setListings(listingsRes.listings || listingsRes.data || []);
      if (bookingsRes?.success) setBookings(bookingsRes.bookings || bookingsRes.data || []);
      if (earningsRes?.success) setEarnings(earningsRes.earnings || earningsRes.data);
      if (expensesRes?.success) setExpenses(expensesRes.expenses || expensesRes.data || []);
      if (analyticsRes?.success) setAnalytics(analyticsRes.analytics || analyticsRes.data);
      if (reviewsRes?.success) setReviews(reviewsRes.reviews || reviewsRes.data || []);
    } catch (err) {
      console.error('Failed to load partner dashboard data:', err);
      setError('Unable to load partner business data. Please check connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPartnerData();
  }, [loadPartnerData]);

  // Handler: Save Listing (Create Draft or Update)
  const handleSaveListing = async (payload) => {
    setIsSubmitting(true);
    try {
      if (editingListing?._id) {
        const res = await updateListing(editingListing._id, payload);
        if (res.success) {
          if (payload.submitForVerification) {
            await submitListingForVerification(editingListing._id);
          }
          await loadPartnerData(true);
          setEditingListing(null);
          handleTabChange('listings');
        } else {
          alert(res.message || 'Failed to update listing.');
        }
      } else {
        const res = await createListingDraft(payload);
        if (res.success) {
          const newId = res.listing?._id || res.data?._id;
          if (payload.submitForVerification && newId) {
            await submitListingForVerification(newId);
          }
          await loadPartnerData(true);
          setEditingListing(null);
          handleTabChange('listings');
        } else {
          alert(res.message || 'Failed to create listing.');
        }
      }
    } catch (err) {
      console.error('Error saving listing:', err);
      alert('An error occurred while saving the listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Delete or Archive Listing
  const handleDeleteListing = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"? If it has past bookings, it will be safely archived.`)) {
      return;
    }
    try {
      const res = await deletePartnerListing(id);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to delete listing.');
      }
    } catch (err) {
      console.error('Delete listing error:', err);
      alert('Failed to delete listing.');
    }
  };

  // Handler: Submit Listing to Platform Admin for Verification
  const handleSubmitVerification = async (id) => {
    try {
      const res = await submitListingForVerification(id);
      if (res.success) {
        await loadPartnerData(true);
        alert('Listing submitted to Discovery Uttarakhand Admin for verification.');
      } else {
        alert(res.message || 'Failed to submit for verification.');
      }
    } catch (err) {
      console.error('Submit verification error:', err);
    }
  };

  // Handler: Update Availability
  const handleUpdateAvailability = async (id, data) => {
    setIsSubmitting(true);
    try {
      const res = await updatePartnerAvailability(id, data);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to update availability.');
      }
    } catch (err) {
      console.error('Update availability error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Update Pricing
  const handleUpdatePricing = async (id, pricingData) => {
    setIsSubmitting(true);
    try {
      const res = await updateListingPricing(id, pricingData);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to update pricing.');
      }
    } catch (err) {
      console.error('Update pricing error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Update Booking Status
  const handleUpdateBookingStatus = async (id, status, notes) => {
    setIsSubmitting(true);
    try {
      const res = await updatePartnerBookingStatus(id, status, notes);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to update booking status.');
      }
    } catch (err) {
      console.error('Update booking status error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Expenses
  const handleCreateExpense = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await createPartnerExpense(payload);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to record expense.');
      }
    } catch (err) {
      console.error('Create expense error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await deletePartnerExpense(id);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to delete expense.');
      }
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  // Handler: Reply to Review
  const handleReplyReview = async (id, text) => {
    setIsSubmitting(true);
    try {
      const res = await replyToPartnerReview(id, text);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to post reply.');
      }
    } catch (err) {
      console.error('Reply review error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Update Business Profile
  const handleUpdateProfile = async (updates) => {
    setIsSubmitting(true);
    try {
      const res = await updateMyPartnerProfile(updates);
      if (res.success) {
        await loadPartnerData(true);
      } else {
        alert(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab Title Map
  const tabTitles = {
    overview: 'Partner Business Dashboard',
    listings: 'Fleet & Stays Inventory',
    'add-listing': editingListing ? 'Edit Listing' : 'Add New Listing',
    bookings: 'Reservations & Bookings',
    availability: 'Fleet Availability & Units',
    pricing: 'Pricing Matrix & Tariffs',
    earnings: 'Revenue & Payouts',
    expenses: 'Expenses & Profit / Loss',
    analytics: 'Business Performance Analytics',
    reviews: 'Customer Ratings & Reviews',
    profile: 'Business Profile & Verification'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-forest-green mb-3" />
        <p className="text-xs font-bold text-gray-700 tracking-wider uppercase">
          Loading Partner Operating System...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar Navigation */}
      <PartnerSidebar
        activeTab={activeTab === 'add-listing' && editingListing ? 'listings' : activeTab}
        setActiveTab={handleTabChange}
        partnerProfile={partnerProfile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <PartnerHeader
          title={tabTitles[activeTab] || 'Partner Dashboard'}
          partnerProfile={partnerProfile}
          onMenuClick={() => setSidebarOpen(true)}
          onAddListingClick={() => {
            setEditingListing(null);
            handleTabChange('add-listing');
          }}
          onRefresh={() => loadPartnerData(true)}
          isRefreshing={isRefreshing}
        />

        {/* Tab Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <OverviewTab
              dashboardStats={dashboardStats}
              partnerProfile={partnerProfile}
              onNavigateTab={(tab) => {
                if (tab === 'add-listing') setEditingListing(null);
                handleTabChange(tab);
              }}
            />
          )}

          {/* TAB 2: Listings */}
          {activeTab === 'listings' && (
            <ListingsTab
              listings={listings}
              onAddListing={() => {
                setEditingListing(null);
                handleTabChange('add-listing');
              }}
              onEditListing={(item) => {
                setEditingListing(item);
                handleTabChange('add-listing');
              }}
              onManagePricing={(item) => {
                handleTabChange('pricing');
              }}
              onManageAvailability={(item) => {
                handleTabChange('availability');
              }}
              onDeleteListing={handleDeleteListing}
              onSubmitVerification={handleSubmitVerification}
              isDeleting={isSubmitting}
            />
          )}

          {/* TAB 3: Add / Edit Listing Form */}
          {activeTab === 'add-listing' && (
            <ListingFormTab
              initialData={editingListing}
              onSave={handleSaveListing}
              onCancel={() => {
                setEditingListing(null);
                handleTabChange('listings');
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* TAB 4: Bookings */}
          {activeTab === 'bookings' && (
            <BookingsTab
              bookings={bookings}
              onUpdateStatus={handleUpdateBookingStatus}
              isUpdating={isSubmitting}
            />
          )}

          {/* TAB 5: Availability */}
          {activeTab === 'availability' && (
            <AvailabilityTab
              listings={listings}
              onUpdateAvailability={handleUpdateAvailability}
              isUpdating={isSubmitting}
            />
          )}

          {/* TAB 6: Pricing */}
          {activeTab === 'pricing' && (
            <PricingTab
              listings={listings}
              onUpdatePricing={handleUpdatePricing}
              isUpdating={isSubmitting}
            />
          )}

          {/* TAB 7: Earnings */}
          {activeTab === 'earnings' && (
            <EarningsTab earningsData={earnings} />
          )}

          {/* TAB 8: Expenses & P&L */}
          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              listings={listings}
              grossRevenue={earnings?.grossRevenue || 0}
              onCreateExpense={handleCreateExpense}
              onDeleteExpense={handleDeleteExpense}
              isSubmitting={isSubmitting}
            />
          )}

          {/* TAB 9: Analytics */}
          {activeTab === 'analytics' && (
            <AnalyticsTab analyticsData={analytics} />
          )}

          {/* TAB 10: Reviews */}
          {activeTab === 'reviews' && (
            <ReviewsTab
              reviews={reviews}
              onReplyReview={handleReplyReview}
              isReplying={isSubmitting}
            />
          )}

          {/* TAB 11: Profile */}
          {activeTab === 'profile' && (
            <ProfileTab
              partnerProfile={partnerProfile}
              onUpdateProfile={handleUpdateProfile}
              isUpdating={isSubmitting}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboardPage;
