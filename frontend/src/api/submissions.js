import api from './axios';
import { SubmissionFileType } from '../types/submission';

export const uploadFile = async (file, assignmentId) => {
  const form = new FormData();
  form.append('file', file);
  form.append('assignmentId', assignmentId);
  const res = await api.post('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const getDraft = (assignmentId) =>
  api.get(`/submissions/draft/${assignmentId}`).then((r) => r.data);

export const saveDraft = (payload) =>
  api.post('/submissions', { ...payload, isDraft: true }).then((r) => r.data);

export const submitDraft = (submissionId) =>
  api.post(`/submissions/draft/submit/${submissionId}`).then((r) => r.data);

export const deleteDraft = (submissionId) =>
  api.delete(`/submissions/draft/${submissionId}`).then((r) => r.data);

export const updateDraft = (submissionId, fields) =>
  api.patch(`/submissions/${submissionId}`, fields).then((r) => r.data);

export const getStudentHistory = (filters = {}) =>
  api.get('/submissions/student/history', { params: filters }).then((r) => r.data);

export const getFileTypeFromFile = (file) =>
  file.type.startsWith('audio') ? SubmissionFileType.AUDIO : SubmissionFileType.VIDEO;

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};