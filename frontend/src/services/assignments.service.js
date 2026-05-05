import api from '../api/axios';

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────
export const getAssignmentsByClass = (classId) =>
  api.get(`/assignments/class/${classId}`).then(r => r.data);

export const getUploadAssignments = (classId) =>
  api.get(`/assignments/class/${classId}/upload`).then(r => r.data);

export const getLiveAssignments = (classId) =>
  api.get(`/assignments/class/${classId}/live`).then(r => r.data);

export const getMyAssignments = () =>
  api.get('/assignments/instructor/mine').then(r => r.data);

export const getAssignment = (id) =>
  api.get(`/assignments/${id}`).then(r => r.data);

export const createAssignment = (data) =>
  api.post('/assignments', data).then(r => r.data);

export const updateAssignment = (id, data) =>
  api.patch(`/assignments/${id}`, data).then(r => r.data);

export const deleteAssignment = (id) =>
  api.delete(`/assignments/${id}`).then(r => r.data);

// ─── SUBMISSIONS (student draft workflow) ────────────────────────────────────

export const uploadDraft = (formData) =>
  api.post('/submissions/draft/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

export const getDraft = (assignmentId) =>
  api.get(`/submissions/draft/${assignmentId}`).then(r => r.data);

export const submitDraft = (submissionId) =>
  api.post(`/submissions/draft/submit/${submissionId}`).then(r => r.data);

export const deleteDraft = (submissionId) =>
  api.delete(`/submissions/draft/${submissionId}`).then(r => r.data);

export const updateDraft = (submissionId, fields) =>
  api.patch(`/submissions/${submissionId}`, fields).then(r => r.data);

// ─── SUBMISSIONS (instructor views) ──────────────────────────────────────────
export const getSubmissionsByAssignment = (assignmentId) =>
  api.get(`/submissions/instructor/by-assignment/${assignmentId}`).then(r => r.data);

export const getInstructorOverview = (params = {}) =>
  api.get('/submissions/instructor/overview', { params }).then(r => r.data);

export const getMissingSubmissions = (params) =>
  api.get('/submissions/instructor/missing', { params }).then(r => r.data);

// ─── SUBMISSIONS (student history) ───────────────────────────────────────────
export const getStudentHistory = (params = {}) =>
  api.get('/submissions/student/history', { params }).then(r => r.data);

export const getMyClasses = () =>
  api.get('/classes/instructor/mine').then(r => r.data);

// ─── UTILS ───────────────────────────────────────────────────────────────────
export const isDeadlinePassed = (deadline) => new Date() > new Date(deadline);

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}; // <--- L'accolade manquante était ici

// ─── RUBRICS ────────────────────────────────────────────────
export const getRubrics = () =>
  api.get('/rubrics').then(r => r.data);

export const getRubric = (id) =>
  api.get('/rubrics/' + id).then(r => r.data);

export const createRubric = (data) =>
  api.post('/rubrics', data).then(r => r.data);

export const updateRubric = (id, data) =>
  api.patch('/rubrics/' + id, data).then(r => r.data);

export const deleteRubric = (id) =>
  api.delete('/rubrics/' + id).then(r => r.data);

export const addCriterion = (rubricId, criterion) =>
  api.post('/rubrics/' + rubricId + '/criteria', criterion).then(r => r.data);

export const removeCriterion = (rubricId, index) =>
  api.delete('/rubrics/' + rubricId + '/criteria/' + index).then(r => r.data);

export const duplicateRubric = (id) =>
  api.post('/rubrics/' + id + '/duplicate').then(r => r.data);

export const getRubricTotalScore = (id) =>
  api.get('/rubrics/' + id + '/total-score').then(r => r.data);