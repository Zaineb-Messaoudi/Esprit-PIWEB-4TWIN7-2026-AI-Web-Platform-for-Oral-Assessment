import api from './axios';

export const getAssignmentsByClass = (classId) =>
  api.get(`/assignments/class/${classId}`).then((r) => r.data);

export const getUploadAssignments = (classId) =>
  api.get(`/assignments/class/${classId}/upload`).then((r) => r.data);

export const getLiveAssignments = (classId) =>
  api.get(`/assignments/class/${classId}/live`).then((r) => r.data);

export const getAssignment = (id) =>
  api.get(`/assignments/${id}`).then((r) => r.data);

export const createAssignment = (data) =>
  api.post('/assignments', data).then((r) => r.data);

export const updateAssignment = (id, data) =>
  api.patch(`/assignments/${id}`, data).then((r) => r.data);

export const deleteAssignment = (id) =>
  api.delete(`/assignments/${id}`).then((r) => r.data);

export const getSubmissionsByAssignment = (assignmentId) =>
  api.get(`/submissions/instructor/by-assignment/${assignmentId}`).then((r) => r.data);


export const isDeadlinePassed = (deadline) =>
  new Date() > new Date(deadline);

export const getAllowedMimeTypes = (allowedFileTypes) => {
  if (allowedFileTypes === 'audio') return 'audio/mpeg,audio/wav,audio/webm';
  if (allowedFileTypes === 'video') return 'video/mp4,video/webm,video/avi';
  return 'audio/mpeg,audio/wav,audio/webm,video/mp4,video/webm,video/avi';


};