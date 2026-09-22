/**
 * Discovery Uttarakhand — AI Trip Planner Frontend Client
 * Calls POST /api/ai/plan with JWT authentication for saved trips or transient payloads.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const generateAiPlan = async ({ tripId, tripData, provider }) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {};
    if (tripId) {
      payload.tripId = tripId;
    } else if (tripData) {
      payload.tripData = tripData;
    }
    if (provider) {
      payload.provider = provider;
    }

    const response = await fetch(`${API_BASE_URL}/ai/plan`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to generate AI trip plan'
      };
    }

    return data;
  } catch (error) {
    console.error('generateAiPlan network error:', error);
    return {
      success: false,
      message: error.message || 'Network error connecting to AI planner service.'
    };
  }
};
