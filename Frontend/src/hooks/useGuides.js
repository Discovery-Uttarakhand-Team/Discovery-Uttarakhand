import { useState, useEffect } from 'react';
import { getGuides } from '../api/guideApi';

export const useGuides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const res = await getGuides();
      if (res.success) {
        setGuides(res.data);
      } else {
        setError(res.message || 'Failed to load guides.');
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
    fetchGuides();
  }, []);

  return { guides, loading, error, refetch: fetchGuides };
};
