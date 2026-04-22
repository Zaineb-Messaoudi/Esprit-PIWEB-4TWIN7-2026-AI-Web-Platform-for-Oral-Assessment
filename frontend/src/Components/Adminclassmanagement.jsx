import { useState, useEffect, memo, useCallback } from 'react';
import {
  BookOpen, Users, Search, ChevronDown, ChevronUp,
  Calendar, Layers, Mail, RefreshCw, GraduationCap,
  CheckCircle, XCircle, Plus, Pencil, Trash2, X,
  UserPlus, UserMinus, Save, AlertTriangle, ShieldOff,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const BASE_URL = 'http://localhost:3000';
const ADMIN_API = 'http://localhost:3000/api/admin';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Normalize admin API user shape → shape expected by modals (firstName/lastName/_id)
const normalizeUser = (u) => ({
  _id: u.id ?? u._id,
  firstName: u.first_name ?? u.firstName ?? '',
  lastName:  u.last_name  ?? u.lastName  ?? '',
  email:     u.email ?? '',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (first = '', last = '') =>
  `${first[0] || '?'}${last[0] || ''}`.toUpperCase();

// ─── Modal Shell ──────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, isDark, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      className={`relative rounded-2xl shadow-2xl border w-full flex flex-col max-h-[90vh] ${wide ? 'max-w-3xl' : 'max-w-lg'} ${
        isDark
          ? 'bg-gray-900 border-white/10'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
        isDark ? 'border-white/10' : 'border-gray-100'
      }`}>
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Body */}
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────

const Field = ({ label, isDark, children }) => (
  <div>
    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`}>{label}</label>
    {children}
  </div>
);

const inputCls = (isDark) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-red-400 focus:ring-red-400/20'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
  }`;

// ─── Class Form Modal (Create / Edit) ─────────────────────────────────────────

const ClassFormModal = ({ cls, instructors, onClose, onSaved, isDark }) => {
  const isEdit = Boolean(cls);
  const [form, setForm] = useState({
    name:         cls?.name         ?? '',
    description:  cls?.description  ?? '',
    instructorId: cls?.instructorId?._id ?? cls?.instructorId ?? '',
    academicYear: cls?.academicYear  ?? '',
    semester:     cls?.semester      ?? '',
    isActive:     cls?.isActive      ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.instructorId || !form.academicYear || !form.semester) {
      setErr('Name, Instructor, Academic Year and Semester are required.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const url    = isEdit ? `${BASE_URL}/classes/${cls._id}` : `${BASE_URL}/classes`;
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
    } catch (e) {
      setErr(e.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Class' : 'New Class'} onClose={onClose} isDark={isDark}>
      <div className="space-y-4">
        <Field label="Class Name" isDark={isDark}>
          <input className={inputCls(isDark)} value={form.name} onChange={set('name')} placeholder="e.g. Advanced Mathematics" />
        </Field>

        <Field label="Description" isDark={isDark}>
          <textarea
            className={`${inputCls(isDark)} resize-none`}
            rows={2}
            value={form.description}
            onChange={set('description')}
            placeholder="Optional short description…"
          />
        </Field>

        <Field label="Instructor" isDark={isDark}>
          <select className={inputCls(isDark)} value={form.instructorId} onChange={set('instructorId')}>
            <option value="">— Select instructor —</option>
            {instructors.map(i => (
              <option key={i._id} value={i._id}>
                {i.firstName} {i.lastName} ({i.email})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Academic Year" isDark={isDark}>
            <input className={inputCls(isDark)} value={form.academicYear} onChange={set('academicYear')} placeholder="2024-2025" />
          </Field>
          <Field label="Semester" isDark={isDark}>
            <input className={inputCls(isDark)} value={form.semester} onChange={set('semester')} placeholder="Fall / Spring / S1…" />
          </Field>
        </div>

        {isEdit && (
          <Field label="Status" isDark={isDark}>
            <select
              className={inputCls(isDark)}
              value={form.isActive ? 'true' : 'false'}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
            >
              <option value="true">Active</option>
              <option value="false">Cancelled</option>
            </select>
          </Field>
        )}

        {err && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{err}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Save Changes' : 'Create Class'}
        </button>
      </div>
    </Modal>
  );
};

// ─── Enroll Students Modal ────────────────────────────────────────────────────
const EnrollModal = ({ cls, allStudents, onClose, onSaved, isDark }) => {
  const enrolled   = new Set((cls.studentIds || []).map(s => s._id ?? s));
  const [selected, setSelected] = useState(new Set(enrolled));
  const [search,   setSearch]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  const toggle = (id) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = allStudents.filter(s => {
    const q = search.toLowerCase();
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      const headers = authHeaders();
      const toAdd    = [...selected].filter(id => !enrolled.has(id));
      const toRemove = [...enrolled].filter(id => !selected.has(id));

      // Run all enroll/unenroll calls in parallel
      await Promise.all([
        ...toAdd.map(studentId =>
          fetch(`${BASE_URL}/classes/${cls._id}/enroll/${studentId}`, {
            method: 'POST',
            headers,
          }).then(r => { if (!r.ok) throw new Error(`Failed to enroll ${studentId}`); })
        ),
        ...toRemove.map(studentId =>
          fetch(`${BASE_URL}/classes/${cls._id}/enroll/${studentId}`, {
            method: 'DELETE',
            headers,
          }).then(r => { if (!r.ok) throw new Error(`Failed to unenroll ${studentId}`); })
        ),
      ]);

      onSaved();
    } catch (e) {
      setErr(e.message || 'Failed to update enrollment');
    } finally {
      setSaving(false);
    }
  };

  const added   = [...selected].filter(id => !enrolled.has(id)).length;
  const removed = [...enrolled].filter(id => !selected.has(id)).length;

  return (
    <Modal title={`Enroll Students — ${cls.name}`} onClose={onClose} isDark={isDark} wide>
      <div className="space-y-4">
        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
            isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            {selected.size} enrolled
          </span>
          {added > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full border font-semibold bg-green-500/10 border-green-500/20 text-green-400">
              +{added} to add
            </span>
          )}
          {removed > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full border font-semibold bg-red-500/10 border-red-500/20 text-red-400">
              −{removed} to remove
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            className={`${inputCls(isDark)} pl-9`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students…"
          />
        </div>

        {/* Student list */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className={`text-sm text-center py-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No students found</p>
          ) : (
            filtered.map(s => {
              const isIn = selected.has(s._id);
              return (
                <button
                  key={s._id}
                  onClick={() => toggle(s._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                    isIn
                      ? isDark
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-green-50 border-green-200'
                      : isDark
                        ? 'bg-white/3 border-white/8 hover:bg-white/8'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${
                    isIn ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-700'
                  }`}>
                    {initials(s.firstName, s.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {s.firstName} {s.lastName}
                    </p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isIn
                      ? 'bg-green-500 border-green-500'
                      : isDark ? 'border-white/20' : 'border-gray-300'
                  }`}>
                    {isIn && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {err && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{err}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Enrollment
        </button>
      </div>
    </Modal>
  );
};

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

const ConfirmModal = ({ cls, onClose, onConfirm, isDark }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Modal title="Cancel Class" onClose={onClose} isDark={isDark}>
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
          <ShieldOff className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <p className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Cancel "{cls.name}"?
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            This will mark the class as <strong>Cancelled</strong>. Students will no longer see it as active. You can reactivate it later via Edit.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              isDark
                ? 'border-white/10 text-gray-300 hover:bg-white/5'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Keep Active
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-700 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Cancel Class
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Search Bar ───────────────────────────────────────────────────────────────

const SearchInput = memo(({ value, onChange, isDark }) => (
  <div className="relative">
    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search by class name or instructor…"
      className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
        isDark
          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-400 focus:ring-red-400/20'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
      }`}
    />
  </div>
));
SearchInput.displayName = 'SearchInput';

// ─── Student Row (expanded) ───────────────────────────────────────────────────

const StudentRow = memo(({ student, index, isDark }) => (
  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-bold">
        {initials(student.firstName, student.lastName)}
      </span>
    </div>
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {student.firstName} {student.lastName}
      </p>
      <p className={`text-xs truncate flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <Mail className="w-2.5 h-2.5" />{student.email}
      </p>
    </div>
    <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>#{index + 1}</span>
  </div>
));
StudentRow.displayName = 'StudentRow';

// ─── Class Row ────────────────────────────────────────────────────────────────

const ClassRow = memo(({ cls, isDark, onEdit, onEnroll, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const instructor = cls.instructorId;
  const students   = cls.studentIds || [];

  return (
    <>
      <tr className={`border-b transition-colors ${
        isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
      }`}>

        {/* Class Name */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-red-500/15' : 'bg-red-50'
            }`}>
              <BookOpen className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {cls.name}
              </p>
              {cls.description && (
                <p className={`text-xs truncate max-w-[200px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {cls.description}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Instructor */}
        <td className="px-4 py-4">
          {instructor ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {(instructor.firstName?.[0] || '?').toUpperCase()}
                </span>
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {instructor.firstName} {instructor.lastName}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{instructor.email}</p>
              </div>
            </div>
          ) : (
            <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>—</span>
          )}
        </td>

        {/* Year / Semester */}
        <td className="px-4 py-4">
          <div className="space-y-1">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${
              isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <Calendar className="w-2.5 h-2.5" />{cls.academicYear}
            </span>
            <br />
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${
              isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <Layers className="w-2.5 h-2.5" />{cls.semester}
            </span>
          </div>
        </td>

        {/* Students count */}
        <td className="px-4 py-4">
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <Users className="w-3.5 h-3.5" />
            {students.length}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-4">
          {cls.isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/20">
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
              <XCircle className="w-3 h-3" /> Cancelled
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-1">
            {/* Expand students */}
            <button
              onClick={() => setExpanded(p => !p)}
              title="View students"
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Enroll */}
            <button
              onClick={() => onEnroll(cls)}
              title="Manage enrollment"
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-blue-500/20 text-blue-400'
                  : 'hover:bg-blue-50 text-blue-500'
              }`}
            >
              <UserPlus className="w-4 h-4" />
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(cls)}
              title="Edit class"
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-yellow-500/20 text-yellow-400'
                  : 'hover:bg-yellow-50 text-yellow-500'
              }`}
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete / Cancel */}
            {cls.isActive && (
              <button
                onClick={() => onDelete(cls)}
                title="Cancel class"
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-red-500/20 text-red-400'
                    : 'hover:bg-red-50 text-red-500'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Student List */}
      {expanded && (
        <tr className={isDark ? 'bg-white/2' : 'bg-gray-50/50'}>
          <td colSpan={6} className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <GraduationCap className="w-3.5 h-3.5" />
                Enrolled Students ({students.length})
              </p>
              <button
                onClick={() => onEnroll(cls)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                <UserPlus className="w-3 h-3" /> Manage Enrollment
              </button>
            </div>
            {students.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                No students enrolled yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {students.map((s, i) => (
                  <StudentRow key={s._id} student={s} index={i} isDark={isDark} />
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
});
ClassRow.displayName = 'ClassRow';

// ─── AdminClassManagement (Main) ──────────────────────────────────────────────

const AdminClassManagement = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [classes,     setClasses]     = useState([]);
  const [students,    setStudents]    = useState([]);   // all platform students
  const [instructors, setInstructors] = useState([]);   // all instructors
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');

  // Modal state
  const [createOpen,  setCreateOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);   // class being edited
  const [enrollTarget,setEnrollTarget]= useState(null);   // class being enrolled
  const [deleteTarget,setDeleteTarget]= useState(null);   // class being cancelled

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/classes`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load classes');
      setClasses(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsersIfNeeded = useCallback(async () => {
    if (instructors.length && students.length) return;
    try {
      const headers = authHeaders();
      const [instrRes, studRes] = await Promise.all([
        fetch(`${ADMIN_API}/teachers`, { headers }),
        fetch(`${ADMIN_API}/students`, { headers }),
      ]);
      if (instrRes.ok) {
        const data = await instrRes.json();
        setInstructors(data.map(normalizeUser));
      }
      if (studRes.ok) {
        const data = await studRes.json();
        setStudents(data.map(normalizeUser));
      }
    } catch {
      // non-fatal — modals handle gracefully
    }
  }, [instructors.length, students.length]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaved = useCallback(() => {
    setCreateOpen(false);
    setEditTarget(null);
    loadClasses();
  }, [loadClasses]);

  const handleEnrollSaved = useCallback(() => {
    setEnrollTarget(null);
    loadClasses();
  }, [loadClasses]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${BASE_URL}/classes/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to cancel class');
      setDeleteTarget(null);
      loadClasses();
    } catch (e) {
      console.error(e);
    }
  }, [deleteTarget, loadClasses]);

  // Open modals (load users lazily)
  const openCreate = () => { loadUsersIfNeeded(); setCreateOpen(true); };
  const openEdit   = (cls) => { loadUsersIfNeeded(); setEditTarget(cls); };
  const openEnroll = (cls) => { loadUsersIfNeeded(); setEnrollTarget(cls); };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = classes.filter(cls => {
    const q = search.toLowerCase();
    const nameMatch  = cls.name?.toLowerCase().includes(q);
    const instrName  = `${cls.instructorId?.firstName || ''} ${cls.instructorId?.lastName || ''}`.toLowerCase();
    return nameMatch || instrName.includes(q);
  });

  // ── Styles ─────────────────────────────────────────────────────────────────

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  const thCls = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
    isDark ? 'text-gray-500' : 'text-gray-400'
  }`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
            All Classes
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Create, manage and enroll students in classes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex gap-3">
            <div className={`px-4 py-2 rounded-xl border text-center ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{classes.length}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border text-center ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Active</p>
              <p className="text-lg font-bold text-green-400">{classes.filter(c => c.isActive).length}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl border text-center ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancelled</p>
              <p className="text-lg font-bold text-red-400">{classes.filter(c => !c.isActive).length}</p>
            </div>
          </div>

          {/* New Class button */}
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20"
          >
            <Plus className="w-4 h-4" />
            New Class
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} isDark={isDark} />

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
          ))}
        </div>
      ) : error ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button onClick={loadClasses}
            className="inline-flex items-center gap-2 text-xs text-red-400 underline hover:text-red-300">
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <BookOpen className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {search ? 'No classes match your search' : 'No classes yet'}
          </p>
          {!search && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create First Class
            </button>
          )}
        </div>
      ) : (
        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <tr>
                  <th className={thCls}>Class</th>
                  <th className={thCls}>Instructor</th>
                  <th className={thCls}>Year / Sem</th>
                  <th className={thCls}>Students</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cls => (
                  <ClassRow
                    key={cls._id}
                    cls={cls}
                    isDark={isDark}
                    onEdit={openEdit}
                    onEnroll={openEnroll}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {createOpen && (
        <ClassFormModal
          cls={null}
          instructors={instructors}
          onClose={() => setCreateOpen(false)}
          onSaved={handleSaved}
          isDark={isDark}
        />
      )}

      {editTarget && (
        <ClassFormModal
          cls={editTarget}
          instructors={instructors}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
          isDark={isDark}
        />
      )}

      {enrollTarget && (
        <EnrollModal
          cls={enrollTarget}
          allStudents={students}
          onClose={() => setEnrollTarget(null)}
          onSaved={handleEnrollSaved}
          isDark={isDark}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          cls={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDark={isDark}
        />
      )}

    </div>
  );
};

export default AdminClassManagement;