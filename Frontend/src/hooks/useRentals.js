import { useState, useEffect } from 'react';
import { getRentals } from '../api/rentalApi';

export const useRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const res = await getRentals();
      if (res.success) {
        setRentals(res.data);
      } else {
        setError(res.message || 'Failed to load rentals.');
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
    fetchRentals();
  }, []);

  return { rentals, loading, error, refetch: fetchRentals };
};
