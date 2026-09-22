import { useState, useEffect } from 'react';
import { getActivities } from '../api/activityApi';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await getActivities();
      if (res.success) {
        setActivities(res.data);
      } else {
        setError(res.message || 'Failed to load data.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return { activities, loading, error, refetch: fetchActivities };
};
