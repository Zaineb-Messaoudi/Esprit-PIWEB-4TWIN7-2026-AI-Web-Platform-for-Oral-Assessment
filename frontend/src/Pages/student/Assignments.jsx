import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileAudio, FileVideo, Send, Trash2, Eye, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  getAssignmentsByClass,
  uploadDraft,
  getDraft,
  submitDraft,
  deleteDraft,
} from '../../services/assignments.service';

const Assignments = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const classId = localStorage.getItem('classId');

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAssignmentsByClass(classId);
      setAssignments(data);
      const draftsMap = {};
      await Promise.all(
        data.map(async (a) => {
          try {
            const draft = await getDraft(a._id);
            if (draft) draftsMap[a._id] = draft;
          } catch {
            // no draft — silently skip
          }
        })
      );
      setDrafts(draftsMap);
    } catch {
      setError('Error loading assignments');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (!classId) {
      setError('Class not found. Please visit My Class page first.');
      setLoading(false);
      return;
    }
    fetchAssignments();
  }, [classId, fetchAssignments]);

  const handleFileUpload = async (assignment, file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const audioExts = ['mp3', 'wav', 'm4a'];
    const videoExts = ['mp4', 'avi', 'mov'];
    const isAudio = audioExts.includes(ext);
    const isVideo = videoExts.includes(ext);

    if (!isAudio && !isVideo) {
      setError('Unsupported format. Use MP3, WAV, M4A, MP4, AVI or MOV');
      return;
    }
    const allowedType = assignment.allowedFileTypes;
    if (allowedType === 'audio' && !isAudio) return setError('Only audio files are accepted');
    if (allowedType === 'video' && !isVideo) return setError('Only video files are accepted');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', assignment.classId);
    formData.append('assignmentId', assignment._id);
    formData.append('assignmentTitle', assignment.title);
    formData.append('title', file.name);
    formData.append('submissionType', 'upload');
    formData.append('fileType', isAudio ? 'audio' : 'video');
    formData.append('isDraft', 'true');

    try {
      setUploading(prev => ({ ...prev, [assignment._id]: true }));
      const draft = await uploadDraft(formData);
      setDrafts(prev => ({ ...prev, [assignment._id]: draft }));
      setSuccess('Draft saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload error');
    } finally {
      setUploading(prev => ({ ...prev, [assignment._id]: false }));
    }
  };

  const handleSubmit = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await submitDraft(draft._id);
      setDrafts(prev => ({ ...prev, [assignmentId]: { ...prev[assignmentId], isDraft: false } }));
      setSuccess('Assignment submitted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission error');
    }
  };

  const handleDelete = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await deleteDraft(draft._id);
      setDrafts(prev => { const updated = { ...prev }; delete updated[assignmentId]; return updated; });
      setSuccess('Draft deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Deletion error');
    }
  };

  const isDeadlinePassed = (deadline) => new Date() > new Date(deadline);

  const getStatusBadge = (assignment) => {
    const draft = drafts[assignment._id];
    if (!draft)           return { label: 'Not started', color: 'gray',   icon: Clock        };
    if (!draft.isDraft)   return { label: 'Submitted',   color: 'green',  icon: CheckCircle  };
    return                       { label: 'Draft',       color: 'yellow', icon: AlertCircle  };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>My Assignments</h2>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Upload your audio/video files before the deadline</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          <FileAudio size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No assignments available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const draft      = drafts[assignment._id];
            const passed     = isDeadlinePassed(assignment.deadline);
            const status     = getStatusBadge(assignment);
            const StatusIcon = status.icon;
            const isUploading = uploading[assignment._id];
            const isSubmitted = draft && !draft.isDraft;

            return (
              <div key={assignment._id} className={`rounded-xl border p-6 transition-all ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:shadow-md'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{assignment.title}</h3>
                    {assignment.description && (
                      <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{assignment.description}</p>
                    )}
                  </div>
                  <span className={`ml-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    status.color === 'green'  ? 'bg-green-100 text-green-700'  :
                    status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    <StatusIcon size={14} /> {status.label}
                  </span>
                </div>

                <div className={`flex items-center gap-4 text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Deadline: {new Date(assignment.deadline).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${passed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {passed ? '⛔ Closed' : '✅ Open'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {assignment.allowedFileTypes === 'audio' ? '🎵 Audio only' :
                     assignment.allowedFileTypes === 'video' ? '🎬 Video only' : '🎵🎬 Audio & Video'}
                  </span>
                </div>

                {/* ── Uploaded file preview ── */}
                {draft && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-white/10' : 'bg-gray-50'}`}>
                    {draft.fileType === 'audio'
                      ? <FileAudio size={20} className="text-blue-500 shrink-0" />
                      : <FileVideo size={20} className="text-purple-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {isSubmitted ? 'Submitted file' : 'Draft file'}
                      </p>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {draft.fileSize ? `${(draft.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                        {draft.fileSize ? ' • ' : ''}
                        {draft.isDraft ? 'Draft — not submitted yet' : 'Permanently submitted'}
                      </p>
                    </div>

                    {/* ── View button — navigates to detail page for submitted, raw link for draft ── */}
                    {isSubmitted ? (
                      <button
                        onClick={() => navigate(`../submissionshistory/${draft._id}`)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <Eye size={14} /> View
                        <ChevronRight size={13} />
                      </button>
                    ) : draft.fileUrl ? (
                      <a
                        href={`http://localhost:3000${draft.fileUrl}`}
                        target="_blank" rel="noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Eye size={18} />
                      </a>
                    ) : null}
                  </div>
                )}

                {/* ── Actions (upload / submit / delete — only when not submitted and deadline not passed) ── */}
                {!passed && !isSubmitted && (
                  <div className="flex flex-wrap gap-3">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all font-medium text-sm ${
                      isUploading ? 'opacity-50 cursor-not-allowed' :
                      isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}>
                      <Upload size={16} />
                      {isUploading ? 'Uploading...' : draft ? 'Replace' : 'Upload'}
                      <input type="file" className="hidden"
                        accept=".mp3,.wav,.m4a,.mp4,.avi,.mov"
                        disabled={isUploading}
                        onChange={(e) => handleFileUpload(assignment, e.target.files[0])} />
                    </label>

                    {draft?.isDraft && (
                      <button onClick={() => handleSubmit(assignment._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-all">
                        <Send size={16} /> Submit
                      </button>
                    )}

                    {draft?.isDraft && (
                      <button onClick={() => handleDelete(assignment._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all">
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </div>
                )}

                {/* ── Submitted confirmation row ── */}
                {isSubmitted && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle size={18} />
                      Submitted on {new Date(draft.submittedAt).toLocaleDateString('en-GB')}
                    </div>
                    <button
                      onClick={() => navigate(`../submissionshistory/${draft._id}`)}
                      className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      View submission <ChevronRight size={15} />
                    </button>
                  </div>
                )}

                {passed && !draft && (
                  <p className="text-red-500 text-sm font-medium">⛔ Deadline passed — no file submitted</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assignments;