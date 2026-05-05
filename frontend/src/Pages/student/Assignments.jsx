import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload, FileAudio, FileVideo, Send, Trash2, Eye,
  CheckCircle, Clock, AlertCircle, ChevronRight, Mic, Video,
  Search, SlidersHorizontal, ChevronDown,
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

// ─── pure helpers ────────────────────────────────────────────────────────────

const isDeadlinePassed = (deadline) => new Date() > new Date(deadline);

const getFileType = (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  return null;
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatShortDate = (iso) => new Date(iso).toLocaleDateString('en-GB');

const formatSize = (bytes) =>
  bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : '';

// ─── status badge ─────────────────────────────────────────────────────────────

const getStatusBadge = (draft) => {
  if (!draft)         return { label: 'Not started', color: 'gray',   Icon: Clock       };
  if (!draft.isDraft) return { label: 'Submitted',   color: 'green',  Icon: CheckCircle };
  return                     { label: 'Draft',       color: 'yellow', Icon: AlertCircle };
};

const BADGE_CLASS = {
  green:  'bg-green-100  text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gray:   'bg-gray-100   text-gray-700',
};

// ─── AssignmentCard ───────────────────────────────────────────────────────────

const AssignmentCard = ({
  assignment, draft, isDark, isUploading, showRecorder, setShowRecorder,
  onFileUpload, onRecordingComplete, onSubmit, onDelete, navigate,
}) => {
  const passed      = isDeadlinePassed(assignment.deadline);
  const status      = getStatusBadge(draft);
  const isSubmitted = draft && !draft.isDraft;
  const isRecording = showRecorder === assignment._id;

  const isLiveType      = assignment.assignmentType === 'live';
  const isRecordOnly    = assignment.assignmentType === 'record';
  // 'upload' type = student submits a file, either by picking one OR recording
  // anything unrecognized also falls here as safe default
  const showBothActions = !isLiveType && !isRecordOnly;

  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const bold  = isDark ? 'text-white'    : 'text-gray-900';
  const card  = isDark
    ? 'rounded-xl border p-6 transition-all bg-white/5 border-white/10 hover:bg-white/10'
    : 'rounded-xl border p-6 transition-all bg-white border-gray-200 hover:shadow-md';

  const allowedLabel =
    assignment.allowedFileTypes === 'audio' ? 'Audio only' :
    assignment.allowedFileTypes === 'video' ? 'Video only' : 'Audio & Video';

  return (
    <div className={card}>

      {/* title + status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${bold}`}>{assignment.title}</h3>
          {assignment.description && (
            <p className={`mt-1 text-sm ${muted}`}>{assignment.description}</p>
          )}
        </div>
        <span className={`ml-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${BADGE_CLASS[status.color]}`}>
          <status.Icon size={14} /> {status.label}
        </span>
      </div>

      {/* meta row */}
      <div className={`flex flex-wrap items-center gap-3 text-sm mb-4 ${muted}`}>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          Deadline: {formatDate(assignment.deadline)}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${passed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          {passed ? 'Closed' : 'Open'}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {allowedLabel}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {isRecordOnly ? 'Record' : isLiveType ? 'Live' : 'Upload & Record'}
        </span>
      </div>

      {/* draft / submitted file preview */}
      {draft && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-white/10' : 'bg-gray-50'}`}>
          {draft.fileType === 'audio'
            ? <FileAudio size={20} className="text-blue-500 shrink-0" />
            : <FileVideo size={20} className="text-purple-500 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${bold}`}>
              {isSubmitted ? 'Submitted file' : 'Draft file'}
            </p>
            <p className={`text-xs truncate ${muted}`}>
              {formatSize(draft.fileSize)}{draft.fileSize ? ' · ' : ''}
              {draft.isDraft ? 'Not submitted yet' : 'Submitted'}
            </p>
          </div>
          {isSubmitted ? (
            <button
              onClick={() => navigate(`../submissionshistory/${draft._id}`)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <Eye size={14} /> View <ChevronRight size={13} />
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

      {/* live type — no student action */}
      {isLiveType && !draft && (
        <p className={`text-sm ${muted}`}>
          This assignment is recorded live by your teacher. Nothing to submit.
        </p>
      )}

      {/* inline recorder */}
      {isRecording && (
        <div className="mb-4">
          <MediaRecorderComponent
            allowedFileTypes={assignment.allowedFileTypes}
            onRecordingComplete={(file, fileType) => onRecordingComplete(assignment, file, fileType)}
            onCancel={() => setShowRecorder(null)}
          />
        </div>
      )}

      {/* action buttons */}
      {!isLiveType && !passed && !isSubmitted && !isRecording && (
        <div className="flex flex-wrap gap-3">
          {showBothActions && (
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-medium text-sm transition-all text-white ${
              isUploading ? 'opacity-50 cursor-not-allowed bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
            }`}>
              <Upload size={16} />
              {isUploading ? 'Uploading…' : draft ? 'Replace file' : 'Upload file'}
              <input
                type="file" className="hidden"
                accept=".mp3,.wav,.m4a,.mp4,.avi,.mov"
                disabled={isUploading}
                onChange={(e) => onFileUpload(assignment, e.target.files[0])}
              />
            </label>
          )}

          {(isRecordOnly || showBothActions) && (
            <button
              onClick={() => setShowRecorder(assignment._id)}
              disabled={isUploading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all ${
                isUploading ? 'opacity-50 cursor-not-allowed bg-purple-500' :
                assignment.allowedFileTypes === 'video'
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {assignment.allowedFileTypes === 'video' ? <Video size={16} /> : <Mic size={16} />}
              {isUploading ? 'Uploading…' : draft ? 'Re-record' : 'Record'}
            </button>
          )}

          {draft?.isDraft && (
            <button onClick={() => onSubmit(assignment._id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-all">
              <Send size={16} /> Submit
            </button>
          )}

          {draft?.isDraft && (
            <button onClick={() => onDelete(assignment._id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all">
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      )}

      {/* submitted confirmation */}
      {isSubmitted && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle size={18} />
            Submitted on {formatShortDate(draft.submittedAt)}
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

      {/* missed deadline */}
      {passed && !draft && (
        <p className="text-red-500 text-sm font-medium">Deadline passed — no file submitted</p>
      )}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const Assignments = () => {
  const { theme } = useTheme();
  const isDark    = theme === 'dark';
  const navigate  = useNavigate();

  const { classId: paramClassId } = useParams();
  const classId = paramClassId || localStorage.getItem('classId');

  const [assignments,  setAssignments]  = useState([]);
  const [drafts,       setDrafts]       = useState({});
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState({});
  const [error,        setError]        = useState(null);
  const [success,      setSuccess]      = useState(null);
  const [showRecorder, setShowRecorder] = useState(null);

  // ── search / filter / sort ─────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [filterType,   setFilterType]   = useState('all');        // all | upload | record | live
  const [filterStatus, setFilterStatus] = useState('all');        // all | not-started | draft | submitted
  const [sortBy,       setSortBy]       = useState('deadline-asc'); // deadline-asc | deadline-desc | title-asc | title-desc
  const [pastOpen,     setPastOpen]     = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchAssignments = useCallback(async () => {
    if (!classId) {
      setError('Class not found. Please visit My Class page first.');
      setLoading(false);
      return;
    }
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
          } catch { /* no draft */ }
        })
      );
      setDrafts(draftsMap);
    } catch {
      setError('Error loading assignments');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const notify = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
    else setError(msg);
  };

  const setDraftEntry    = (id, d) => setDrafts(prev => ({ ...prev, [id]: d }));
  const removeDraftEntry = (id)    => setDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
  const setUploadingState = (id, v) => setUploading(prev => ({ ...prev, [id]: v }));

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleFileUpload = async (assignment, file) => {
    if (!file) return;
    const fileType = getFileType(file);
    if (!fileType) return notify('Unsupported format. Use MP3, WAV, M4A, MP4, AVI or MOV', 'error');
    const allowed = assignment.allowedFileTypes;
    if (allowed === 'audio' && fileType !== 'audio') return notify('Only audio files are accepted', 'error');
    if (allowed === 'video' && fileType !== 'video') return notify('Only video files are accepted', 'error');

    const formData = new FormData();
    formData.append('file',            file);
    formData.append('classId',         assignment.classId);
    formData.append('assignmentId',    assignment._id);
    formData.append('assignmentTitle', assignment.title);
    formData.append('title',           file.name);
    formData.append('submissionType',  'upload');
    formData.append('fileType',        fileType);
    formData.append('isDraft',         'true');

    try {
      setUploadingState(assignment._id, true);
      const draft = await uploadDraft(formData);
      setDraftEntry(assignment._id, draft);
      notify('Draft saved!');
    } catch (err) {
      notify(err.response?.data?.message || 'Upload error', 'error');
    } finally {
      setUploadingState(assignment._id, false);
    }
  };

  const handleRecordingComplete = async (assignment, file, fileType) => {
    try {
      setUploadingState(assignment._id, true);
      setShowRecorder(null);
      const formData = new FormData();
      formData.append('file',            file);
      formData.append('classId',         assignment.classId);
      formData.append('assignmentId',    assignment._id);
      formData.append('assignmentTitle', assignment.title);
      formData.append('title',           file.name);
      formData.append('submissionType',  'upload');  // backend accepts: upload | live
      formData.append('fileType',        fileType);
      formData.append('isDraft',         'true');
      const draft = await uploadDraft(formData);
      setDraftEntry(assignment._id, draft);
      notify('Recording saved!');
    } catch (err) {
      notify(err.response?.data?.message || 'Upload error', 'error');
    } finally {
      setUploadingState(assignment._id, false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await submitDraft(draft._id);
      setDraftEntry(assignmentId, { ...draft, isDraft: false });
      notify('Assignment submitted successfully!');
    } catch (err) {
      notify(err.response?.data?.message || 'Submission error', 'error');
    }
  };

  const handleDelete = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await deleteDraft(draft._id);
      removeDraftEntry(assignmentId);
      notify('Draft deleted');
    } catch (err) {
      notify(err.response?.data?.message || 'Deletion error', 'error');
    }
  };

  // ── derived: filter + sort ─────────────────────────────────────────────────

  const applyFiltersAndSort = useCallback((list) => {
    let result = [...list];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }

    if (filterType !== 'all') {
      result = result.filter(a => a.assignmentType === filterType);
    }

    if (filterStatus !== 'all') {
      result = result.filter(a => {
        const draft = drafts[a._id];
        if (filterStatus === 'not-started') return !draft;
        if (filterStatus === 'draft')       return draft?.isDraft;
        if (filterStatus === 'submitted')   return draft && !draft.isDraft;
        return true;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'deadline-asc')  return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === 'deadline-desc') return new Date(b.deadline) - new Date(a.deadline);
      if (sortBy === 'title-asc')     return a.title.localeCompare(b.title);
      if (sortBy === 'title-desc')    return b.title.localeCompare(a.title);
      return 0;
    });

    return result;
  }, [search, filterType, filterStatus, sortBy, drafts]);

  const { active: activeAssignments, past: pastAssignments } = useMemo(() => ({
    active: applyFiltersAndSort(assignments.filter(a => !isDeadlinePassed(a.deadline))),
    past:   applyFiltersAndSort(assignments.filter(a =>  isDeadlinePassed(a.deadline))),
  }), [assignments, applyFiltersAndSort]);

  // ── shared card props factory ──────────────────────────────────────────────

  const cardProps = (assignment) => ({
    assignment,
    draft:               drafts[assignment._id],
    isDark,
    isUploading:         uploading[assignment._id],
    showRecorder,
    setShowRecorder,
    onFileUpload:        handleFileUpload,
    onRecordingComplete: handleRecordingComplete,
    onSubmit:            handleSubmit,
    onDelete:            handleDelete,
    navigate,
  });

  // ── style shorthands ───────────────────────────────────────────────────────

  const muted  = isDark ? 'text-gray-400' : 'text-gray-500';
  const bold   = isDark ? 'text-white'    : 'text-gray-900';
  const inputCls = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-400'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400';
  const selectCls = isDark
    ? 'bg-white/5 border-white/10 text-white focus:border-red-400'
    : 'bg-white border-gray-200 text-gray-700 focus:border-red-400';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* header */}
      <div>
        <h2 className={`text-3xl font-bold ${bold}`}>My Assignments</h2>
        <p className={`mt-1 ${muted}`}>Submit your audio or video before the deadline</p>
      </div>

      {/* alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* ── search + filter + sort bar ── */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* search */}
        <div className="relative flex-1 min-w-48">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
          <input
            type="text"
            placeholder="Search assignments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none transition ${inputCls}`}
          />
        </div>

        {/* type filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className={muted} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm outline-none transition ${selectCls}`}
          >
            <option value="all">All types</option>
            <option value="upload">Upload</option>
            <option value="record">Record</option>
            <option value="live">Live</option>
          </select>
        </div>

        {/* status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm outline-none transition ${selectCls}`}
        >
          <option value="all">All statuses</option>
          <option value="not-started">Not started</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
        </select>

        {/* sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm outline-none transition ${selectCls}`}
        >
          <option value="deadline-asc">Deadline ↑</option>
          <option value="deadline-desc">Deadline ↓</option>
          <option value="title-asc">Title A–Z</option>
          <option value="title-desc">Title Z–A</option>
        </select>
      </div>

      {/* ── active assignments ── */}
      {activeAssignments.length === 0 && assignments.filter(a => !isDeadlinePassed(a.deadline)).length === 0 && pastAssignments.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          <FileAudio size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No assignments available</p>
        </div>
      ) : activeAssignments.length === 0 ? (
        <div className={`text-center py-10 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          <p className="text-sm">No active assignments match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeAssignments.map(a => (
            <AssignmentCard key={a._id} {...cardProps(a)} />
          ))}
        </div>
      )}

      {/* ── past assignments collapsible ── */}
      {pastAssignments.length > 0 && (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-gray-200'}`}>

          <button
            onClick={() => setPastOpen(o => !o)}
            className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
              isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock size={18} className={muted} />
              <span className={`font-semibold ${bold}`}>Past Assignments</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                {pastAssignments.length}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${muted} ${pastOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {pastOpen && (
            <div className={`p-4 space-y-4 ${isDark ? 'bg-white/[0.02]' : 'bg-white'}`}>
              {pastAssignments.map(a => (
                <AssignmentCard key={a._id} {...cardProps(a)} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Assignments;
