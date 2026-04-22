import { useState, useEffect, useCallback } from 'react';
import { getStudentHistory } from '../api/submissions';

export const useSubmissions = (filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentHistory(JSON.parse(filtersKey));
      setData(res);
    } catch {
      setError('Failed to load submission history');
    } finally {
      setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    submissions: data?.submissions ?? [],
    summary: data?.summary ?? { total: 0, pending: 0, graded: 0, cancelled: 0 },
    loading,
    error,
    refetch: fetch,
  };
};