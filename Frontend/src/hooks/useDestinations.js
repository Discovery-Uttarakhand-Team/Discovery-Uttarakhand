import { useState, useEffect } from 'react';
import { getDestinations } from '../api/destinationApi';

export const useDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const res = await getDestinations();
      if (res.success) {
        setDestinations(res.data);
      } else {
        setError(res.message || 'Failed to load destinations.');
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
    fetchDestinations();
  }, []);

  return { destinations, loading, error, refetch: fetchDestinations };
};
