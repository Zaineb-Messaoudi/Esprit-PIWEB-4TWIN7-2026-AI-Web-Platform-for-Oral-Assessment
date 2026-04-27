import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileAudio, FileVideo, Send, Trash2, Eye,
  CheckCircle, Clock, AlertCircle, ChevronRight, Mic, Video
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  getAssignmentsByClass,
  uploadDraft,
  getDraft,
  submitDraft,
  deleteDraft,
} from '../../services/assignments.service';
import MediaRecorderComponent from '../../Components/MediaRecorder.jsx';

const Assignments = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [assignments, setAssignments]   = useState([]);
  const [drafts, setDrafts]             = useState({});
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState({});
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);
  const [showRecorder, setShowRecorder] = useState(null);

  const classId = '69c992a61582c4952fc51db2';

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
          } catch (_) {
            // no draft
          }
        })
      );
      setDrafts(draftsMap);
    } catch (_) {
      setError('Error loading assignments');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleRecordingComplete = async (assignment, file, fileType) => {
    try {
      setUploading((prev) => ({ ...prev, [assignment._id]: true }));
      setShowRecorder(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', assignment.classId);
      formData.append('assignmentId', assignment._id);
      formData.append('fileType', fileType);
      const draft = await uploadDraft(formData);
      setDrafts((prev) => ({ ...prev, [assignment._id]: draft }));
      setSuccess('Recording saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || 'Upload error');
    } finally {
      setUploading((prev) => ({ ...prev, [assignment._id]: false }));
    }
  };

  const handleSubmit = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await submitDraft(draft._id);
      setDrafts((prev) => ({
        ...prev,
        [assignmentId]: { ...prev[assignmentId], isDraft: false },
      }));
      setSuccess('Assignment submitted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || 'Submission error');
    }
  };

  const handleDelete = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await deleteDraft(draft._id);
      setDrafts((prev) => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });
      setSuccess('Draft deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || 'Deletion error');
    }
  };

  const isDeadlinePassed = (deadline) => new Date() > new Date(deadline);

  const getStatusBadge = (assignment) => {
    const draft = drafts[assignment._id];
    if (!draft)         return { label: 'Not started', color: 'gray',   icon: Clock       };
    if (!draft.isDraft) return { label: 'Submitted',   color: 'green',  icon: CheckCircle };
    return                     { label: 'Draft',       color: 'yellow', icon: AlertCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className={isDark ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>
          My Assignments
        </h2>
        <p className={isDark ? 'mt-1 text-gray-400' : 'mt-1 text-gray-600'}>
          Record your audio or video before the deadline
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto font-bold">x</button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className={
          isDark
            ? 'text-center py-16 rounded-xl border bg-white/5 border-white/10 text-gray-400'
            : 'text-center py-16 rounded-xl border bg-gray-50 border-gray-200 text-gray-500'
        }>
          <FileAudio size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No assignments available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const draft       = drafts[assignment._id];
            const passed      = isDeadlinePassed(assignment.deadline);
            const status      = getStatusBadge(assignment);
            const StatusIcon  = status.icon;
            const isUploading = uploading[assignment._id];
            const isSubmitted = draft && !draft.isDraft;
            const isRecording = showRecorder === assignment._id;

            const cardClass = isDark
              ? 'rounded-xl border p-6 transition-all bg-white/5 border-white/10 hover:bg-white/10'
              : 'rounded-xl border p-6 transition-all bg-white border-gray-200 hover:shadow-md';

            const badgeClass =
              status.color === 'green'  ? 'ml-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700' :
              status.color === 'yellow' ? 'ml-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700' :
                                          'ml-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700';

            const infoClass = isDark
              ? 'flex items-center gap-4 text-sm mb-4 text-gray-400'
              : 'flex items-center gap-4 text-sm mb-4 text-gray-500';

            const deadlineBadge = passed
              ? 'px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600'
              : 'px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-600';

            const typeBadge = isDark
              ? 'px-2 py-0.5 rounded text-xs bg-white/10 text-gray-300'
              : 'px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600';

            const draftBoxClass = isDark
              ? 'mb-4 p-3 rounded-lg flex items-center gap-3 bg-white/10'
              : 'mb-4 p-3 rounded-lg flex items-center gap-3 bg-gray-50';

            const recordBtnClass = isUploading
              ? 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all opacity-50 cursor-not-allowed bg-blue-500'
              : assignment.allowedFileTypes === 'video'
                ? 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all bg-purple-500 hover:bg-purple-600'
                : 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all bg-blue-500 hover:bg-blue-600';

            return (
              <div key={assignment._id} className={cardClass}>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={isDark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>
                      {assignment.title}
                    </h3>
                    {assignment.description && (
                      <p className={isDark ? 'mt-1 text-sm text-gray-400' : 'mt-1 text-sm text-gray-600'}>
                        {assignment.description}
                      </p>
                    )}
                  </div>
                  <span className={badgeClass}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                <div className={infoClass}>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Deadline: {new Date(assignment.deadline).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className={deadlineBadge}>
                    {passed ? 'Closed' : 'Open'}
                  </span>
                  <span className={typeBadge}>
                    {assignment.allowedFileTypes === 'audio' ? 'Audio only' :
                     assignment.allowedFileTypes === 'video' ? 'Video only' : 'Audio and Video'}
                  </span>
                </div>

                {draft && (
                  <div className={draftBoxClass}>
                    {draft.fileType === 'audio'
                      ? <FileAudio size={20} className="text-blue-500 shrink-0" />
                      : <FileVideo size={20} className="text-purple-500 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={isDark ? 'text-sm font-medium text-white' : 'text-sm font-medium text-gray-800'}>
                        {isSubmitted ? 'Submitted file' : 'Draft file'}
                      </p>
                      <p className={isDark ? 'text-xs truncate text-gray-400' : 'text-xs truncate text-gray-500'}>
                        {draft.fileSize ? ((draft.fileSize / 1024 / 1024).toFixed(2) + ' MB · ') : ''}
                        {draft.isDraft ? 'Not submitted yet' : 'Submitted'}
                      </p>
                    </div>
                    {isSubmitted ? (
                      <button
                        onClick={() => navigate('../submissionshistory/' + draft._id)}
                        className={
                          isDark
                            ? 'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all bg-white/10 hover:bg-white/20 text-white'
                            : 'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }
                      >
                        <Eye size={14} /> View <ChevronRight size={13} />
                      </button>
                    ) : (
                      draft.fileUrl && (
                        <a
                          href={['http://localhost:3000', draft.fileUrl].join('')}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Eye size={18} />
                        </a>
                      )
                    )}
                  </div>
                )}

                {isRecording && (
                  <div className="mb-4">
                    <MediaRecorderComponent
                      allowedFileTypes={assignment.allowedFileTypes}
                      onRecordingComplete={(file, fileType) => handleRecordingComplete(assignment, file, fileType)}
                      onCancel={() => setShowRecorder(null)}
                    />
                  </div>
                )}

                {!passed && !isSubmitted && !isRecording && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowRecorder(assignment._id)}
                      disabled={isUploading}
                      className={recordBtnClass}
                    >
                      {assignment.allowedFileTypes === 'video' ? <Video size={16} /> : <Mic size={16} />}
                      {isUploading ? 'Uploading...' : draft ? 'Re-record' : 'Record'}
                    </button>

                    {draft && draft.isDraft && (
                      <button
                        onClick={() => handleSubmit(assignment._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-all"
                      >
                        <Send size={16} /> Submit
                      </button>
                    )}

                    {draft && draft.isDraft && (
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </div>
                )}

                {isSubmitted && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle size={18} />
                      <span>
                        Submitted on {new Date(draft.submittedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('../submissionshistory/' + draft._id)}
                      className={
                        isDark
                          ? 'flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition bg-white/10 hover:bg-white/20 text-white'
                          : 'flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }
                    >
                      View submission <ChevronRight size={15} />
                    </button>
                  </div>
                )}

                {passed && !draft && (
                  <p className="text-red-500 text-sm font-medium">
                    Deadline passed — no file submitted
                  </p>
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
