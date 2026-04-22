import { useState, useEffect, useCallback } from 'react';
import { getUploadAssignments } from '../api/assignments';

export const useAssignments = (classId) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUploadAssignments(classId);
      setAssignments(data);
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignments, loading, error, refetch: fetch };
};