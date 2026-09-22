import { useState, useEffect } from 'react';
import { getCulturePlaces } from '../api/cultureApi';

export const useCulturePlaces = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const res = await getCulturePlaces();
      if (res.success) {
        setPlaces(res.data);
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
    fetchPlaces();
  }, []);

  return { places, loading, error, refetch: fetchPlaces };
};
