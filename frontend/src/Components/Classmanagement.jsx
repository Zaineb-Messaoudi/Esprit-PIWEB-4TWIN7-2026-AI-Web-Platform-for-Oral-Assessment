import { useState, useEffect, useCallback, memo } from 'react';
import {
  BookOpen, Users, Plus, Pencil, Trash2, X, Save,
  RefreshCw, Check, ChevronDown, ChevronUp, GraduationCap,
  Calendar, Layers, AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const BASE_URL = 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

// ─── Feedback Banner ──────────────────────────────────────────────────────────

const Banner = memo(({ message }) => {
  if (!message) return null;
  const ok = message.toLowerCase().includes('success');
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border ${
      ok
        ? 'bg-green-500/15 text-green-400 border-green-500/20'
        : 'bg-red-500/15 text-red-400 border-red-500/20'
    }`}>
      {ok ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  );
});
Banner.displayName = 'Banner';

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

const ClassModal = memo(({ initial, onClose, onSaved, isDark }) => {
  const isEdit = !!initial?._id;

  const empty = { name: '', description: '', academicYear: '', semester: '' };
  const [form, setForm]     = useState(initial ? {
    name:         initial.name         || '',
    description:  initial.description  || '',
    academicYear: initial.academicYear || '',
    semester:     initial.semester     || '',
  } : empty);
  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState('');

  const inputCls = `w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 text-sm ${
    isDark
      ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:border-red-400 focus:ring-red-400/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
  }`;

  const labelCls = `block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url    = isEdit
        ? `${BASE_URL}/classes/${initial._id}`
        : `${BASE_URL}/classes`;
        
      const res = await fetch(url, {
  method,
  headers: authHeaders(),
  body: JSON.stringify(form),
});

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save class');
      }

      const saved = await res.json();
      setMessage('Class saved successfully!');
      setTimeout(() => { onSaved(saved, isEdit); onClose(); }, 800);
    } catch (err) {
      setMessage(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
      }`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
  isDark ? 'border-white/10' : 'border-gray-200'
}`}>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BookOpen className="w-5 h-5 text-red-500" />
            {isEdit ? 'Edit Class' : 'Create New Class'}
          </h2>
          <button onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Class Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              required placeholder="e.g. Web Development 101" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Brief description of the class..."
              className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Academic Year *</label>
              <input name="academicYear" value={form.academicYear} onChange={handleChange}
                required placeholder="e.g. 2025-2026" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Semester *</label>
              <select name="semester" value={form.semester} onChange={handleChange}
                required className={inputCls}>
                <option value="" disabled>Select</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
              </select>
            </div>
          </div>

          <Banner message={message} />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                isDark ? 'border-white/15 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all hover:scale-105">
              {saving
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Saving…</>
                : <><Save className="w-4 h-4" />{isEdit ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
ClassModal.displayName = 'ClassModal';

// ─── Student List (expandable) ────────────────────────────────────────────────

const StudentList = memo(({ classId, isDark }) => {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/classes/${classId}/students`, {
          headers: authHeaders(),   // ← fixed
        });
        if (!res.ok) throw new Error('Failed to load students');
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  if (loading) return (
    <div className="py-4 space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-10 rounded-lg animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
      ))}
    </div>
  );

  if (error) return <p className="text-sm text-red-400 py-3">{error}</p>;

  if (students.length === 0) return (
    <p className={`text-sm py-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
      No students enrolled yet.
    </p>
  );

  return (
    <div className="mt-3 space-y-2">
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        Students ({students.length}) — A-Z
      </p>
      {students.map((s, i) => (
        <div key={s._id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {(s.firstName?.[0] || '?').toUpperCase()}{(s.lastName?.[0] || '').toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {s.firstName} {s.lastName}
            </p>
            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.email}</p>
          </div>
          <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            #{i + 1}
          </span>
        </div>
      ))}
    </div>
  );
});
StudentList.displayName = 'StudentList';

// ─── Class Card ───────────────────────────────────────────────────────────────

const ClassCard = memo(({ cls, onEdit, onCancel, isDark }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border transition-colors duration-300 overflow-hidden ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
    } ${!cls.isActive ? 'opacity-60' : ''}`}>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {cls.name}
              </h3>
              {!cls.isActive && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                  Cancelled
                </span>
              )}
            </div>
            {cls.description && (
              <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {cls.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <Calendar className="w-3 h-3" />{cls.academicYear}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <Layers className="w-3 h-3" />{cls.semester}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <Users className="w-3 h-3" />{cls.studentIds?.length || 0} students
              </span>
            </div>
          </div>

          {cls.isActive && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => onEdit(cls)}
                className={`p-2 rounded-lg border transition-all hover:scale-105 ${
                  isDark ? 'border-white/15 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}>
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => onCancel(cls._id)}
                className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all hover:scale-105">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(p => !p)}
          className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
            isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
          }`}>
          <GraduationCap className="w-3.5 h-3.5" />
          {expanded ? 'Hide students' : 'Show students'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <StudentList classId={cls._id} isDark={isDark} />
        </div>
      )}
    </div>
  );
});
ClassCard.displayName = 'ClassCard';

// ─── Cancel Confirm Dialog ────────────────────────────────────────────────────

const ConfirmCancel = memo(({ onConfirm, onClose, isDark }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${
      isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cancel Class</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            This will mark the class as cancelled. Are you sure?
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            isDark ? 'border-white/15 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}>
          Keep it
        </button>
        <button onClick={onConfirm}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all">
          Yes, cancel
        </button>
      </div>
    </div>
  </div>
));
ConfirmCancel.displayName = 'ConfirmCancel';

// ─── ClassManagement (Main) ───────────────────────────────────────────────────

const ClassManagement = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [classes,    setClasses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [cancelId,   setCancelId]   = useState(null);
  const [banner,     setBanner]     = useState('');

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');
      console.log('TOKEN:', localStorage.getItem('token')); // ← add this
    try {
      const res = await fetch(`${BASE_URL}/classes/instructor/mine`, {
        headers: authHeaders(),   // ← fixed
      });
          console.log('STATUS:', res.status); // ← and this

      if (!res.ok) throw new Error('Failed to load classes');
      const data = await res.json();
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // ClassManagement.jsx — replace handleSaved
const handleSaved = useCallback(() => {
  setBanner('Class saved successfully!');
  setTimeout(() => setBanner(''), 3000);
  loadClasses(); // re-fetch from server — no more stale optimistic state
}, [loadClasses]);

  const handleCancel = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/classes/${cancelId}`, {
        method: 'DELETE',
        headers: authHeaders(),   // ← fixed
      });
      if (!res.ok) throw new Error('Failed to cancel class');
      setClasses(prev => prev.map(c => c._id === cancelId ? { ...c, isActive: false } : c));
      setBanner('Class cancelled successfully!');
      setTimeout(() => setBanner(''), 3000);
    } catch (err) {
      setBanner(err.message);
    } finally {
      setCancelId(null);
    }
  }, [cancelId]);

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
            My Classes
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your classes and student lists
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all hover:scale-105 shadow-lg shadow-red-500/20"
        >
          <Plus className="w-4 h-4" />
          New Class
        </button>
      </div>

      {banner && <Banner message={banner} />}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-44 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
          ))}
        </div>
      ) : error ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={loadClasses}
            className="mt-3 text-xs text-red-400 underline hover:text-red-300">
            Try again
          </button>
        </div>
      ) : classes.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <BookOpen className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No classes yet
          </p>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Create your first class to get started
          </p>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all">
            <Plus className="w-4 h-4" /> Create Class
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {classes.map(cls => (
            <ClassCard
              key={cls._id}
              cls={cls}
              isDark={isDark}
              onEdit={(c) => { setEditTarget(c); setShowModal(true); }}
              onCancel={(id) => setCancelId(id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ClassModal
          initial={editTarget}
          isDark={isDark}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {cancelId && (
        <ConfirmCancel
          isDark={isDark}
          onClose={() => setCancelId(null)}
          onConfirm={handleCancel}
        />
      )}

    </div>
  );
};

export default ClassManagement;