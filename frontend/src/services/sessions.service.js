import api from '../api/axios';

// ─── INSTRUCTOR — CRUD ───────────────────────────────────────────────────────

// POST /sessions
// Body: { title, classId, assignmentId, scheduledDate, waitTimePerStudent }
export const createSession = (data) =>
  api.post('/sessions', data).then(r => r.data);

// PUT /sessions/:id
// Body: { title?, scheduledDate?, waitTimePerStudent? }
export const updateSession = (id, data) =>
  api.put(`/sessions/${id}`, data).then(r => r.data);

// PATCH /sessions/:id/cancel
export const cancelSession = (id) =>
  api.patch(`/sessions/${id}/cancel`).then(r => r.data);

// ─── INSTRUCTOR — SESSION DAY FLOW ──────────────────────────────────────────

// PATCH /sessions/:id/start   — open the session (must be on scheduled date)
export const startSession = (id) =>
  api.patch(`/sessions/${id}/start`).then(r => r.data);

// GET /sessions/:id/students  — A-Z list + current student + recorded/skipped sets
export const getSessionStudents = (id) =>
  api.get(`/sessions/${id}/students`).then(r => r.data);

// PATCH /sessions/:id/next/:studentId  — save current & advance to next
export const nextStudent = (sessionId, studentId) =>
  api.patch(`/sessions/${sessionId}/next/${studentId}`).then(r => r.data);

// PATCH /sessions/:id/skip/:studentId  — skip a student
export const skipStudent = (sessionId, studentId) =>
  api.patch(`/sessions/${sessionId}/skip/${studentId}`).then(r => r.data);

// PATCH /sessions/:id/complete
export const completeSession = (id) =>
  api.patch(`/sessions/${id}/complete`).then(r => r.data);

// ─── READ ────────────────────────────────────────────────────────────────────

// GET /sessions/class/:classId  — all sessions for a class
export const getSessionsByClass = (classId) =>
  api.get(`/sessions/class/${classId}`).then(r => r.data);

// GET /sessions/:id
export const getSession = (id) =>
  api.get(`/sessions/${id}`).then(r => r.data);

// ─── STUDENT ────────────────────────────────────────────────────────────────

// GET /sessions/:id/my-slot   — position, estimatedTime, status
export const getMySlot = (sessionId) =>
  api.get(`/sessions/${sessionId}/my-slot`).then(r => r.data);

// ─── RECORDINGS ──────────────────────────────────────────────────────────────

// POST /recordings/session/:sessionId/instructor  — instructor records current student
// Body: FormData { file, fileType: 'audio'|'video' }
export const instructorRecord = (sessionId, formData) =>
  api.post(`/recordings/session/${sessionId}/instructor`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

// POST /recordings/:recordingId/save  — confirm preview → creates Submission + advances session
export const saveRecording = (recordingId) =>
  api.post(`/recordings/${recordingId}/save`).then(r => r.data);

// POST /recordings/session/:sessionId/student/audio  — student records audio
export const studentRecordAudio = (sessionId, formData) =>
  api.post(`/recordings/session/${sessionId}/student/audio`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

// POST /recordings/session/:sessionId/student/video  — student records video
export const studentRecordVideo = (sessionId, formData) =>
  api.post(`/recordings/session/${sessionId}/student/video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

// POST /recordings/:recordingId/submit  — student confirms their own recording
export const studentSubmitRecording = (recordingId) =>
  api.post(`/recordings/${recordingId}/submit`).then(r => r.data);

// GET /recordings/:recordingId/preview
export const getRecordingPreview = (recordingId) =>
  api.get(`/recordings/${recordingId}/preview`).then(r => r.data);

// DELETE /recordings/:recordingId/discard  — reject preview, delete file from disk
export const discardRecording = (recordingId) =>
  api.delete(`/recordings/${recordingId}/discard`).then(r => r.data);