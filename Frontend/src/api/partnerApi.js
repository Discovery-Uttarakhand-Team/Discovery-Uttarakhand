/**
 * Discovery Uttarakhand — Partner & Admin Verification API Client
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// ── Partner Operations ──────────────────────────────────────────────

export const registerPartner = async (partnerData) => {
  const res = await fetch(`${API_BASE_URL}/partners`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(partnerData)
  });
  return await res.json();
};

export const getMyPartnerProfile = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/me`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const updateMyPartnerProfile = async (updates) => {
  const res = await fetch(`${API_BASE_URL}/partners/me`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return await res.json();
};

export const createListingDraft = async (listingData) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(listingData)
  });
  return await res.json();
};

export const getMyListings = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const getMyListingById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${id}`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const updateListing = async (id, updates) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return await res.json();
};

export const submitListingForVerification = async (id) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${id}/submit`, {
    method: 'POST',
    headers: getHeaders()
  });
  return await res.json();
};

export const reopenRejectedListing = async (id) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${id}/reopen`, {
    method: 'POST',
    headers: getHeaders()
  });
  return await res.json();
};

// ── Extended Partner Business Operations ────────────────────────────

export const getPartnerDashboardStats = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/dashboard`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const deletePartnerListing = async (id) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await res.json();
};

export const updateListingPricing = async (id, pricingData) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${id}/pricing`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(pricingData)
  });
  return await res.json();
};

export const getPartnerBookings = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_BASE_URL}/partners/me/bookings${params ? `?${params}` : ''}`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const updatePartnerBookingStatus = async (id, status, notes = '') => {
  const res = await fetch(`${API_BASE_URL}/partners/me/bookings/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status, notes })
  });
  return await res.json();
};

export const getPartnerAvailability = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/me/availability`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const updatePartnerAvailability = async (id, availabilityData) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${id}/availability`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(availabilityData)
  });
  return await res.json();
};

export const getPartnerEarnings = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/me/earnings`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const getPartnerExpenses = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/me/expenses`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const createPartnerExpense = async (expenseData) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/expenses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(expenseData)
  });
  return await res.json();
};

export const deletePartnerExpense = async (id) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/expenses/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await res.json();
};

export const getPartnerAnalytics = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/me/analytics`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const getPartnerReviews = async () => {
  const res = await fetch(`${API_BASE_URL}/partners/me/reviews`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const replyToPartnerReview = async (id, text) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/reviews/${id}/reply`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text })
  });
  return await res.json();
};

export const uploadPartnerImages = async (formData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/partners/me/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  return await res.json();
};

export const uploadListingImages = async (listingId, formData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${listingId}/images`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  return await res.json();
};

export const deleteListingImage = async (listingId, imageId) => {
  const res = await fetch(`${API_BASE_URL}/partners/me/listings/${listingId}/images/${imageId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return await res.json();
};

// ── Admin Verification Operations ───────────────────────────────────

export const getPendingListingsAdmin = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/listings/pending`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const getListingForAdmin = async (id) => {
  const res = await fetch(`${API_BASE_URL}/admin/listings/${id}`, {
    headers: getHeaders()
  });
  return await res.json();
};

export const verifyListingAdmin = async (id, notes = '') => {
  const res = await fetch(`${API_BASE_URL}/admin/listings/${id}/verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ notes })
  });
  return await res.json();
};

export const rejectListingAdmin = async (id, reason) => {
  const res = await fetch(`${API_BASE_URL}/admin/listings/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  });
  return await res.json();
};

export const getVerificationLogsAdmin = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/verification-logs`, {
    headers: getHeaders()
  });
  return await res.json();
};
