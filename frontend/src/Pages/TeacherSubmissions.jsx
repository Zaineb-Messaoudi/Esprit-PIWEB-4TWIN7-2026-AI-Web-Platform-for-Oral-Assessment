import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileSearch,
  Filter,
  FolderKanban,
  LoaderCircle,
  Search,
  Users,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { api } from '../utils/api';

const defaultSummary = { total: 0, pending: 0, graded: 0, cancelled: 0 };

const defaultMissing = {
  assignmentTitle: '',
  class: null,
  counts: { totalStudents: 0, submitted: 0, missing: 0 },
  missingStudents: [],
};

const formatName = (person) => {
  if (!person) return 'Unknown user';
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return fullName || person.username || person.email || 'Unknown user';
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

const statusStyles = {
  pending:   'bg-amber-500/15 text-amber-200 border border-amber-400/30',
  graded:    'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
  cancelled: 'bg-red-500/15 text-red-200 border border-red-400/30',
};

function TeacherSubmissions() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [classes,        setClasses]        = useState([]);
  const [showFilters,    setShowFilters]    = useState(false);
  const [filters,        setFilters]        = useState({ classId: '', studentId: '', assignmentTitle: '', status: '', dateFrom: '', dateTo: '' });
  const [overview,       setOverview]       = useState([]);
  const [summary,        setSummary]        = useState(defaultSummary);
  const [missingData,    setMissingData]    = useState(defaultMissing);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error,          setError]          = useState('');

  const selectedClass  = classes.find((c) => c.id === filters.classId) || null;
  const studentOptions = selectedClass?.students || [];

  useEffect(() => {
    if (!filters.classId) {
      setFilters((prev) => (prev.studentId ? { ...prev, studentId: '' } : prev));
      return;
    }
    const stillExists = studentOptions.some((s) => s.id === filters.studentId);
    if (!stillExists && filters.studentId) setFilters((prev) => ({ ...prev, studentId: '' }));
  }, [filters.classId, filters.studentId, studentOptions]);

  useEffect(() => {
    let cancelled = false;
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const { data } = await api.get(`/classes/instructor/mine`);
        if (!cancelled) {
          const normalized = (Array.isArray(data) ? data : []).map((cls) => ({
            ...cls,
            id: cls._id ?? cls.id,
            students: (cls.studentIds || []).map((s) => {
              if (typeof s === 'string') return null;
              return { id: s._id ?? s.id ?? s, firstName: s.firstName ?? '', lastName: s.lastName ?? '', username: s.username ?? '', email: s.email ?? '' };
            }).filter(Boolean),
          }));
          setClasses(normalized);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Unable to load classes.');
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    };
    loadClasses();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { loadOverview(); }, []); // eslint-disable-line

  const buildParams = (sourceFilters = filters) => {
    const params = {};
    Object.entries(sourceFilters).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) params[key] = value.trim();
    });
    return params;
  };

  const loadOverview = async (sourceFilters = filters) => {
    setLoadingResults(true);
    setError('');
    try {
      const params = buildParams(sourceFilters);
      const { data } = await api.get('/submissions/instructor/overview', { params });
      setOverview(Array.isArray(data?.submissions) ? data.submissions : []);
      setSummary(data?.summary || defaultSummary);
      if (params.classId && params.assignmentTitle) {
        const { data: missing } = await api.get('/submissions/instructor/missing', {
          params: { classId: params.classId, assignmentTitle: params.assignmentTitle },
        });
        setMissingData(missing || defaultMissing);
      } else {
        setMissingData(defaultMissing);
      }
    } catch (err) {
      setOverview([]); setSummary(defaultSummary); setMissingData(defaultMissing);
      setError(err.response?.data?.message || 'Unable to load submission data.');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleFilterChange = (e) => { const { name, value } = e.target; setFilters((prev) => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); loadOverview(); };
  const handleReset  = () => { const r = { classId: '', studentId: '', assignmentTitle: '', status: '', dateFrom: '', dateTo: '' }; setFilters(r); loadOverview(r); };

  const cardBase   = isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white/90 border-gray-200 text-gray-900 shadow-sm';
  const inputBase  = isDark ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
  const mutedText  = isDark ? 'text-gray-300' : 'text-gray-600';
  const subtleText = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">

      {/* ── Header / Summary ─────────────────────────────────────────────── */}
      <section className={`rounded-3xl border p-6 md:p-8 ${cardBase}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${isDark ? 'bg-red-500/20 text-red-100' : 'bg-red-50 text-red-700'}`}>
              <FolderKanban size={16} />
              Submission command center
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">Instructor submission view</h2>
            <p className={`mt-3 text-sm md:text-base ${mutedText}`}>
              Review every submission in your classes, narrow the list by student or assignment, and spot who still has not submitted.
            </p>
          </div>
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { label: 'Total submissions', value: summary.total,     icon: FileSearch,   accent: isDark ? 'text-red-200'     : 'text-red-700'     },
              { label: 'Pending',           value: summary.pending,   icon: Clock3,       accent: isDark ? 'text-amber-200'   : 'text-amber-700'   },
              { label: 'Graded',            value: summary.graded,    icon: CheckCircle2, accent: isDark ? 'text-emerald-200' : 'text-emerald-700' },
              { label: 'Cancelled',         value: summary.cancelled, icon: LoaderCircle, accent: isDark ? 'text-sky-200'     : 'text-sky-700'     },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className={`w-full rounded-2xl border p-3 sm:p-4 ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`mb-2 flex items-center justify-between ${accent}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xl sm:text-2xl font-bold">{value}</span>
                </div>
                <p className={`text-xs sm:text-sm ${subtleText}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <section className={`rounded-3xl border p-6 ${cardBase}`}>
        <div className="flex cursor-pointer select-none items-center gap-3" onClick={() => setShowFilters((prev) => !prev)}>
          <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10' : 'bg-red-50'}`}>
            <Filter className={isDark ? 'text-red-200' : 'text-red-700'} size={20} />
          </div>
          <ChevronDown size={20} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''} ${mutedText}`} />
        </div>

        {showFilters && (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-2 text-sm">
                <span className={subtleText}>Class</span>
                <select name="classId" value={filters.classId} onChange={handleFilterChange} disabled={loadingClasses}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}>
                  <option value="">All classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}{cls.academicYear ? ` — ${cls.academicYear}` : ''}{cls.semester ? ` ${cls.semester}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className={subtleText}>Student</span>
                <select name="studentId" value={filters.studentId} onChange={handleFilterChange}
                  disabled={!filters.classId || !studentOptions.length}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}>
                  <option value="">All students</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>{[s.firstName, s.lastName].filter(Boolean).join(' ') || s.username}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className={subtleText}>Assignment</span>
                <input type="text" name="assignmentTitle" value={filters.assignmentTitle}
                  onChange={handleFilterChange} placeholder="e.g. Oral presentation 1"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`} />
              </label>

              <label className="space-y-2 text-sm">
                <span className={subtleText}>Status</span>
                <select name="status" value={filters.status} onChange={handleFilterChange}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}>
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="graded">Graded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className={subtleText}>From date</span>
                <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`} />
              </label>

              <label className="space-y-2 text-sm">
                <span className={subtleText}>To date</span>
                <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`} />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                isDark ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-red-600 text-white hover:bg-red-700'
              }`}>
                <Search size={18} /> Apply filters
              </button>
              <button type="button" onClick={handleReset} className={`rounded-2xl border px-5 py-3 font-semibold transition ${
                isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
              }`}>
                Reset
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <section className={`rounded-3xl border p-4 ${isDark ? 'border-red-400/30 bg-red-500/10 text-red-100' : 'border-red-200 bg-red-50 text-red-700'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5" size={18} />
            <p className="text-sm">{error}</p>
          </div>
        </section>
      )}

      {/* ── Missing submissions panel ─────────────────────────────────────── */}
      {filters.classId && filters.assignmentTitle.trim() && (
        <section className={`rounded-3xl border p-6 ${cardBase}`}>
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Missing submissions</h3>
              <p className={`text-sm ${mutedText}`}>
                Students in <span className="font-semibold">{missingData.class?.name || selectedClass?.name || 'selected class'}</span>{' '}
                who have not submitted <span className="font-semibold">{filters.assignmentTitle.trim()}</span>.
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${isDark ? 'bg-black/20 text-white' : 'bg-gray-50 text-gray-700'}`}>
              <Users size={16} />
              {missingData.counts.missing} missing / {missingData.counts.totalStudents} students
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[['Class roster', missingData.counts.totalStudents], ['Submitted', missingData.counts.submitted], ['Still missing', missingData.counts.missing]].map(([label, value]) => (
              <div key={label} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-sm ${subtleText}`}>{label}</p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border">
            <div className={`grid grid-cols-[1.4fr_1fr_1fr] px-4 py-3 text-sm font-semibold ${isDark ? 'border-white/10 bg-white/5 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
              <span>Student</span><span>Username</span><span>Email</span>
            </div>
            {missingData.missingStudents.length ? (
              missingData.missingStudents.map((student) => (
                <div key={student.id} className={`grid grid-cols-[1.4fr_1fr_1fr] gap-4 px-4 py-3 text-sm ${isDark ? 'border-t border-white/10 text-gray-200' : 'border-t border-gray-200 text-gray-700'}`}>
                  <span>{formatName(student)}</span>
                  <span>{student.username || 'N/A'}</span>
                  <span className="truncate">{student.email || 'N/A'}</span>
                </div>
              ))
            ) : (
              <div className={`px-4 py-6 text-sm ${mutedText}`}>Everyone in this class has already submitted for the selected assignment.</div>
            )}
          </div>
        </section>
      )}

      {/* ── Submission list table ─────────────────────────────────────────── */}
      <section className={`rounded-3xl border ${cardBase}`}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold">Submission list</h3>
            <p className={`text-sm ${mutedText}`}>Click any row to open and review the submission media.</p>
          </div>
          {loadingResults ? (
            <div className={`inline-flex items-center gap-2 text-sm ${mutedText}`}><LoaderCircle className="animate-spin" size={16} />Loading</div>
          ) : (
            <div className={`inline-flex items-center gap-2 text-sm ${mutedText}`}><CalendarDays size={16} />{overview.length} result{overview.length === 1 ? '' : 's'}</div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={isDark ? 'bg-white/5 text-gray-200' : 'bg-gray-50 text-gray-700'}>
              <tr>
                <th className="px-6 py-4 font-semibold">Assignment</th>
                <th className="px-6 py-4 font-semibold">Class</th>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Submitted at</th>
                <th className="px-6 py-4 font-semibold">Recorded by</th>
                <th className="px-6 py-4 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {loadingResults ? (
                <tr><td colSpan="7" className={`px-6 py-10 text-center ${mutedText}`}>Fetching submissions...</td></tr>
              ) : overview.length ? (
                overview.map((submission) => (
                  <tr
                    key={submission.id}
                    onClick={() => navigate(`../submissions/${submission.id}`)}
                    className={`cursor-pointer transition-colors ${
                      isDark ? 'border-t border-white/10 hover:bg-white/5' : 'border-t border-gray-200 hover:bg-red-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold">{submission.assignmentTitle}</div>
                      <div className={subtleText}>{submission.title || 'Untitled submission'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{submission.class?.name || 'Unknown class'}</div>
                      <div className={subtleText}>{[submission.class?.academicYear, submission.class?.semester].filter(Boolean).join(' • ') || 'No cycle details'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{formatName(submission.student)}</div>
                      <div className={subtleText}>{submission.student?.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[submission.status] || (isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 text-gray-700 border border-gray-200')
                      }`}>
                        {submission.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatDateTime(submission.submittedAt)}</td>
                    <td className="px-6 py-4">
                      {submission.recordedBy ? (
                        <div>
                          <div>{formatName(submission.recordedBy)}</div>
                          <div className={subtleText}>{submission.recordedBy.username}</div>
                        </div>
                      ) : (
                        <span className={subtleText}>Student upload</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight size={16} className={subtleText} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className={`px-6 py-10 text-center ${mutedText}`}>No submissions match the current filters yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default TeacherSubmissions;