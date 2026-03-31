import { api } from '../utils/api';

// ─── ASSIGNMENTS ────────────────────────────────────────────
export const getAssignmentsByClass = (classId) =>
  api.get(`/assignments/class/${classId}`).then(r => r.data);

export const createAssignment = (data) =>
  api.post('/assignments', data).then(r => r.data);

export const getAssignment = (id) =>
  api.get(`/assignments/${id}`).then(r => r.data);

// ─── SUBMISSIONS ────────────────────────────────────────────
export const uploadDraft = (formData) =>
  api.post('/submissions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

export const getDraft = (assignmentId) =>
  api.get(`/submissions/draft/${assignmentId}`).then(r => r.data);

export const submitDraft = (submissionId) =>
  api.patch(`/submissions/${submissionId}/submit`).then(r => r.data);

export const deleteDraft = (submissionId) =>
  api.delete(`/submissions/${submissionId}`).then(r => r.data);

export const getMySubmissions = () =>
  api.get('/submissions/my').then(r => r.data);

export const getSubmissionsByAssignment = (assignmentId) =>
  api.get(`/submissions/assignment/${assignmentId}`).then(r => r.data);

export const getMyClasses = () =>
  api.get('/classes').then(r => r.data);