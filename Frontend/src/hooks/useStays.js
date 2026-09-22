import { useState, useEffect } from 'react';
import { getStays } from '../api/stayApi';

export const useStays = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStays = async () => {
    try {
      setLoading(true);
      const res = await getStays();
      if (res.success) {
        setStays(res.data);
      } else {
        setError(res.message || 'Failed to load stays.');
      }
    } catch (err) {
      if (!err.response) {
        setError('Unable to connect to server.');
      } else if (err.response.status === 404) {
        setError('Requested item was not found.');
      } else if (err.response.status >= 500) {
        setError('Server Error');
      } else {
        setError(err.response.data?.message || 'An error occurred while loading data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStays();
  }, []);

  return { stays, loading, error, refetch: fetchStays };
};
