import { useState, useEffect, memo, useCallback } from 'react';
import {
  BookOpen, Users, Search, ChevronDown, ChevronUp,
  Calendar, Layers, Mail, RefreshCw, GraduationCap,
  CheckCircle, XCircle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const BASE_URL = 'http://localhost:3000';

// ─── Search Bar ───────────────────────────────────────────────────────────────

const SearchInput = memo(({ value, onChange, isDark }) => (
  <div className="relative">
    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
      isDark ? 'text-gray-500' : 'text-gray-400'
    }`} />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search by class name or instructor…"
      className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 ${
        isDark
          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-400 focus:ring-red-400/20'
          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
      }`}
    />
  </div>
));
SearchInput.displayName = 'SearchInput';

// ─── Student Row ──────────────────────────────────────────────────────────────

const StudentRow = memo(({ student, index, isDark }) => (
  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-bold">
        {(student.firstName?.[0] || '?').toUpperCase()}
        {(student.lastName?.[0]  || '').toUpperCase()}
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

// ─── Class Row (table row with expandable detail) ─────────────────────────────

const ClassRow = memo(({ cls, isDark }) => {
  const [expanded, setExpanded] = useState(false);

  const instructor = cls.instructorId;
  const students   = cls.studentIds || [];

  return (
    <>
      {/* Main Row */}
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
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {instructor.email}
                </p>
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

        {/* Expand */}
        <td className="px-4 py-4">
          <button
            onClick={() => setExpanded(p => !p)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {/* Expanded Student List */}
      {expanded && (
        <tr className={isDark ? 'bg-white/2' : 'bg-gray-50/50'}>
          <td colSpan={6} className="px-6 py-4">
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <GraduationCap className="w-3.5 h-3.5" />
              Enrolled Students ({students.length})
            </p>
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

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/classes`);
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

  // Filter by class name or instructor name
  const filtered = classes.filter(cls => {
    const q = search.toLowerCase();
    const nameMatch = cls.name?.toLowerCase().includes(q);
    const instrName = `${cls.instructorId?.firstName || ''} ${cls.instructorId?.lastName || ''}`.toLowerCase();
    const instrMatch = instrName.includes(q);
    return nameMatch || instrMatch;
  });

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  const thCls = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
    isDark ? 'text-gray-500' : 'text-gray-400'
  }`;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
            All Classes
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Overview of all classes across the platform
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className={`px-4 py-2 rounded-xl border text-center ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {classes.length}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl border text-center ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Active</p>
            <p className="text-lg font-bold text-green-400">
              {classes.filter(c => c.isActive).length}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl border text-center ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancelled</p>
            <p className="text-lg font-bold text-red-400">
              {classes.filter(c => !c.isActive).length}
            </p>
          </div>
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
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {search ? 'No classes match your search' : 'No classes found'}
          </p>
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
                  <th className={thCls}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cls => (
                  <ClassRow key={cls._id} cls={cls} isDark={isDark} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminClassManagement;