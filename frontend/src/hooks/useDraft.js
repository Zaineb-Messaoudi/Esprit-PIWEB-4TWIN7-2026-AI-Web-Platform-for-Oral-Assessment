import { useState, useEffect, useCallback } from 'react';
import { getDraft, saveDraft, submitDraft, deleteDraft, updateDraft } from '../api/submissions';

export const useDraft = (assignmentId) => {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assignmentId) return;
    setLoading(true);
    getDraft(assignmentId)
      .then(setDraft)
      .catch(() => setDraft(null))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const save = useCallback(async (payload) => {
    setError(null);
    try {
      const updated = draft?.id
        ? await updateDraft(draft.id, payload)
        : await saveDraft(payload);
      setDraft(updated);
      return updated;
    } catch {
      setError('Failed to save draft');
      throw new Error('Failed to save draft');
    }
  }, [draft]);

  const submit = useCallback(async () => {
    if (!draft?.id) throw new Error('No draft to submit');
    setSubmitting(true);
    setError(null);
    try {
      const submitted = await submitDraft(draft.id);
      setDraft(null);
      return submitted;
    } catch {
      setError('Failed to submit');
      throw new Error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }, [draft]);

  const discard = useCallback(async () => {
    if (!draft?.id) return;
    await deleteDraft(draft.id);
    setDraft(null);
  }, [draft]);

  return { draft, loading, submitting, error, save, submit, discard };
};