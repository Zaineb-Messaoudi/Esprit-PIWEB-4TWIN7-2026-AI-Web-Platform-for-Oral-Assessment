import React, { useState, useEffect } from 'react';
import {
  Plus, Eye, Users, Clock, CheckCircle, AlertCircle,
  FileAudio, FileVideo, X, Pencil, Trash2, RefreshCw,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  createAssignment, updateAssignment, deleteAssignment,
  getAssignmentsByClass, getSubmissionsByAssignment,
  isDeadlinePassed, getMyClasses,
} from '../../services/assignments.service';

const AssignmentsTeacher = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [classes,            setClasses]            = useState([]);
  const [selectedClassId,    setSelectedClassId]    = useState('');
  const [assignments,        setAssignments]        = useState([]);
  const [submissions,        setSubmissions]        = useState({});
  const [loading,            setLoading]            = useState(false);
  const [classesLoading,     setClassesLoading]     = useState(true);
  const [showForm,           setShowForm]           = useState(false);
  const [editTarget,         setEditTarget]         = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [error,              setError]              = useState(null);
  const [success,            setSuccess]            = useState(null);

  const emptyForm = {
    classId: '',
    title: '',
    description: '',
    type: 'upload',
    allowedFileTypes: 'both',
    deadline: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ─── Load instructor's classes on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyClasses();
        setClasses(data);
        // Auto-select the first class if only one exists
        if (data.length === 1) {
          setSelectedClassId(data[0]._id);
        }
      } catch {
        showError('Failed to load your classes');
      } finally {
        setClassesLoading(false);
      }
    })();
  }, []);

  // ─── Fetch assignments whenever the selected class changes ───────────────
  useEffect(() => {
    if (selectedClassId) fetchAssignments();
    else setAssignments([]);
  }, [selectedClassId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await getAssignmentsByClass(selectedClassId);
      setAssignments(data);
    } catch {
      showError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };
  const showError   = (msg) => { setError(msg);   setTimeout(() => setError(null),   4000); };

  // ─── CREATE ───────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAssignment({ ...form });
      showSuccess('Assignment created!');
      setShowForm(false);
      setForm(emptyForm);
      if (form.classId === selectedClassId) fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  // ─── EDIT ─────────────────────────────────────────────────────────────────
  const openEdit = (assignment) => {
    setEditTarget(assignment);
    setForm({
      classId:          assignment.classId,
      title:            assignment.title,
      description:      assignment.description || '',
      type:             assignment.type,
      allowedFileTypes: assignment.allowedFileTypes,
      deadline:         assignment.deadline
        ? new Date(assignment.deadline).toISOString().slice(0, 16)
        : '',
    });
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateAssignment(editTarget._id, {
        title:            form.title,
        description:      form.description,
        allowedFileTypes: form.allowedFileTypes,
        deadline:         form.deadline,
      });
      showSuccess('Assignment updated!');
      setShowForm(false);
      setEditTarget(null);
      setForm(emptyForm);
      fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update assignment');
    }
  };

  // ─── CANCEL ───────────────────────────────────────────────────────────────
  const handleCancel = async (assignment) => {
    if (!window.confirm(`Cancel assignment "${assignment.title}"?`)) return;
    try {
      await deleteAssignment(assignment._id);
      showSuccess('Assignment cancelled.');
      fetchAssignments();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel assignment');
    }
  };

  // ─── VIEW SUBMISSIONS ─────────────────────────────────────────────────────
  const handleViewSubmissions = async (assignment) => {
    if (selectedAssignment?._id === assignment._id) {
      setSelectedAssignment(null);
      return;
    }
    setSelectedAssignment(assignment);
    if (!submissions[assignment._id]) {
      try {
        const data = await getSubmissionsByAssignment(assignment._id);
        setSubmissions(prev => ({ ...prev, [assignment._id]: data }));
      } catch {
        showError('Failed to load submissions');
      }
    }
  };

  // ─── OPEN FORM ────────────────────────────────────────────────────────────
  const openCreateForm = () => {
    setEditTarget(null);
    // Pre-fill classId with the currently viewed class (user can change it)
    setForm({ ...emptyForm, classId: selectedClassId });
    setShowForm(true);
  };

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDark
      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;
  const labelCls = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  if (classesLoading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin h-10 w-10 text-red-500" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Assignments
          </h2>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Create and manage audio/video assignments for your class.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
        >
          <Plus size={18} />
          New assignment
        </button>
      </div>

      {/* Class selector bar */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
      }`}>
        <label className={`text-sm font-medium whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Viewing class:
        </label>
        <select
          value={selectedClassId}
          onChange={e => { setSelectedClassId(e.target.value); setSelectedAssignment(null); }}
          className={`${inputCls} max-w-xs`}
        >
          <option value="">— Select a class —</option>
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>{cls.name}</option>
          ))}
        </select>
        {selectedClassId && loading && (
          <RefreshCw size={16} className="animate-spin text-red-500 ml-1" />
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-auto">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editTarget ? 'Edit Assignment' : 'Create Assignment'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditTarget(null); }}>
              <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>

          <form onSubmit={editTarget ? handleUpdate : handleCreate} className="space-y-4">

            {/* Class picker — only shown on create */}
            {!editTarget && (
              <div>
                <label className={labelCls}>Class *</label>
                <select
                  required
                  value={form.classId}
                  onChange={e => setForm(p => ({ ...p, classId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— Select a class —</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>Title *</label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={inputCls} placeholder="e.g. Oral presentation chapter 3"
              />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={`${inputCls} resize-none`}
                placeholder="Instructions for students..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!editTarget && (
                <div>
                  <label className={labelCls}>Assignment type *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="upload">Upload (student uploads file)</option>
                    <option value="live">Live (recorded in session)</option>
                  </select>
                </div>
              )}

              <div>
                <label className={labelCls}>Allowed file type *</label>
                <select
                  value={form.allowedFileTypes}
                  onChange={e => setForm(p => ({ ...p, allowedFileTypes: e.target.value }))}
                  className={inputCls}
                >
                  <option value="both">Audio & Video</option>
                  <option value="audio">Audio only</option>
                  <option value="video">Video only</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Deadline *</label>
                <input
                  type="datetime-local" required value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all">
                {editTarget ? 'Save changes' : 'Create'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setEditTarget(null); }}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prompt when no class selected */}
      {!selectedClassId ? (
        <div className={`text-center py-16 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a class above to view its assignments</p>
        </div>

      ) : assignments.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <Plus size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No assignments yet</p>
          <p className="text-sm mt-1">Click "New assignment" to get started</p>
        </div>

      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const subs       = submissions[assignment._id] || [];
            const isSelected = selectedAssignment?._id === assignment._id;
            const passed     = isDeadlinePassed(assignment.deadline);

            return (
              <div key={assignment._id} className={`rounded-xl border transition-all ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              }`}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {assignment.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                          assignment.type === 'live'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {assignment.type === 'live' ? '🔴 Live' : '📁 Upload'}
                        </span>
                      </div>

                      {assignment.description && (
                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {assignment.description}
                        </p>
                      )}

                      <div className={`flex items-center flex-wrap gap-3 mt-2 text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(assignment.deadline).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          passed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {passed ? '🔒 Closed' : '✅ Open'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button onClick={() => openEdit(assignment)} title="Edit"
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                        }`}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleCancel(assignment)} title="Cancel assignment"
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                        }`}>
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => handleViewSubmissions(assignment)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          isSelected
                            ? 'bg-red-500 text-white'
                            : isDark
                              ? 'bg-white/10 text-white hover:bg-white/20'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        <Users size={16} />
                        Submissions
                      </button>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className={`border-t px-6 py-4 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Submissions ({subs.length})
                    </h4>
                    {subs.length === 0 ? (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        No submissions yet for this assignment.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {subs.map((sub, index) => (
                          <div
                            key={sub._id ? `${sub._id}-${index}` : `sub-${index}`}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              isDark ? 'bg-white/5' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {sub.fileType === 'audio'
                                ? <FileAudio size={18} className="text-blue-500" />
                                : <FileVideo size={18} className="text-purple-500" />
                              }
                              <div>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {sub.studentId?.firstName} {sub.studentId?.lastName}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {sub.studentId?.email}
                                  {sub.submittedAt && ` • Submitted ${new Date(sub.submittedAt).toLocaleDateString('en-GB')}`}
                                </p>
                              </div>
                            </div>
                            {(sub.audioFileUrl || sub.videoFileUrl) && (
                              <a
                                href={'http://localhost:3000' + (sub.audioFileUrl || sub.videoFileUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-all"
                              >
                                <Eye size={14} />
                                View
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignmentsTeacher;