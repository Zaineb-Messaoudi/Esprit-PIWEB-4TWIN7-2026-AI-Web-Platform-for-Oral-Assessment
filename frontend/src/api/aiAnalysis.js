import { api } from '../utils/api';

export const getAiAnalysis = (submissionId) =>
  api.get(`/ai-analyses/submission/${submissionId}`).then((r) => r.data);

export const updateAiFeedback = (analysisId, body) =>
  api.patch(`/ai-analyses/${analysisId}/feedback`, body).then((r) => r.data);