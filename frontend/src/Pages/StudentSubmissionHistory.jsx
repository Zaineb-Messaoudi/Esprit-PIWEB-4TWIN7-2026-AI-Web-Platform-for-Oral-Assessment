import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Filter,
  LoaderCircle,
  Search,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const userId = () => localStorage.getItem('userId') || '';

const defaultSummary = {
  total: 0,
  pending: 0,
  evaluated: 0,
  inProgress: 0,
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const statusStyles = {
  pending:     'bg-amber-500/15 text-amber-200 border border-amber-400/30',
  evaluated:   'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
  in_progress: 'bg-sky-500/15 text-sky-200 border border-sky-400/30',
};

function StudentSubmissionHistory() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    classId: '',
    assignmentTitle: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [submissions, setSubmissions]   = useState([]);
  const [summary, setSummary]           = useState(defaultSummary);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  // ── Load the class the student is enrolled in ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        // The student endpoint returns ONE class object (the student's class).
        // We wrap it in an array so the dropdown works uniformly.
        const { data } = await api.get(`/classes/student/${userId()}`);

        if (!cancelled) {
          if (data && data._id) {
            setClasses([{ ...data, id: data._id ?? data.id }]);
          } else {
            setClasses([]);
          }
        }
      } catch {
        // Student may not be enrolled yet — non-fatal, just leave the list empty
        if (!cancelled) setClasses([]);
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    };

    loadClasses();
    return () => { cancelled = true; };
  }, []);

  // ── Load submission history on mount ──────────────────────────────────────
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildParams = (sourceFilters = filters) => {
    const params = {};
    Object.entries(sourceFilters).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        params[key] = value.trim();
      }
    });
    return params;
  };

  const loadHistory = async (sourceFilters = filters) => {
    setLoadingHistory(true);
    setError('');
    try {
      const { data } = await api.get('/submissions/student/history', {
        params: buildParams(sourceFilters),
      });
      setSubmissions(Array.isArray(data?.submissions) ? data.submissions : []);
      setSummary(data?.summary || defaultSummary);
    } catch (err) {
      setSubmissions([]);
      setSummary(defaultSummary);
      setError(
        err.response?.data?.message || 'Unable to load your submission history right now.',
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

  const handleReset = () => {
    const reset = { classId: '', assignmentTitle: '', status: '', dateFrom: '', dateTo: '' };
    setFilters(reset);
    loadHistory(reset);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const cardBase = isDark
    ? 'bg-white/10 border-white/10 text-white'
    : 'bg-white/90 border-gray-200 text-gray-900 shadow-sm';

  const inputBase = isDark
    ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-400'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';

  const mutedText  = isDark ? 'text-gray-300' : 'text-gray-600';
  const subtleText = isDark ? 'text-gray-400' : 'text-gray-500';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header / Summary ───────────────────────────────────────────────── */}
      <section className={`rounded-3xl border p-6 md:p-8 ${cardBase}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
              isDark ? 'bg-red-500/20 text-red-100' : 'bg-red-50 text-red-700'
            }`}>
              <ClipboardList size={16} />
              My submission timeline
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">Student submission history</h2>
            <p className={`mt-3 text-sm md:text-base ${mutedText}`}>
              Browse all your submissions with the exact status and date history.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'All submissions', value: summary.total,      icon: ClipboardList, accent: isDark ? 'text-red-200'     : 'text-red-700'     },
              { label: 'Pending',         value: summary.pending,    icon: Clock3,        accent: isDark ? 'text-amber-200'   : 'text-amber-700'   },
              { label: 'In progress',     value: summary.inProgress, icon: LoaderCircle,  accent: isDark ? 'text-sky-200'     : 'text-sky-700'     },
              { label: 'Evaluated',       value: summary.evaluated,  icon: CheckCircle2,  accent: isDark ? 'text-emerald-200' : 'text-emerald-700' },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className={`rounded-2xl border p-4 ${
                  isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`mb-4 flex items-center justify-between ${accent}`}>
                  <Icon size={18} />
                  <span className="text-2xl font-bold">{value}</span>
                </div>
                <p className={`text-sm ${subtleText}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <section className={`rounded-3xl border p-6 ${cardBase}`}>
        <div className="mb-5 flex items-center gap-3">
          <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10' : 'bg-red-50'}`}>
            <Filter className={isDark ? 'text-red-200' : 'text-red-700'} size={20} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Filter history</h3>
            <p className={`text-sm ${mutedText}`}>
              Narrow by class, assignment, date, or current review status.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

            {/* Class — populated from the student's enrolled class */}
            <label className="space-y-2 text-sm">
              <span className={subtleText}>Class</span>
              <select
                name="classId"
                value={filters.classId}
                onChange={handleFilterChange}
                disabled={loadingClasses}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}
              >
                <option value="">All classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.academicYear ? ` — ${cls.academicYear}` : ''}
                    {cls.semester     ? ` ${cls.semester}`       : ''}
                  </option>
                ))}
              </select>
            </label>

            {/* Assignment */}
            <label className="space-y-2 text-sm">
              <span className={subtleText}>Assignment</span>
              <input
                type="text"
                name="assignmentTitle"
                value={filters.assignmentTitle}
                onChange={handleFilterChange}
                placeholder="Search by assignment"
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}
              />
            </label>

            {/* Status */}
            <label className="space-y-2 text-sm">
              <span className={subtleText}>Status</span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="evaluated">Evaluated</option>
              </select>
            </label>

            {/* From date */}
            <label className="space-y-2 text-sm">
              <span className={subtleText}>From date</span>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}
              />
            </label>

            {/* To date */}
            <label className="space-y-2 text-sm">
              <span className={subtleText}>To date</span>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                isDark ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <Search size={18} />
              Apply filters
            </button>
            <button
              type="button"
              onClick={handleReset}
              className={`rounded-2xl border px-5 py-3 font-semibold transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <section className={`rounded-3xl border p-4 ${
          isDark
            ? 'border-red-400/30 bg-red-500/10 text-red-100'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5" size={18} />
            <p className="text-sm">{error}</p>
          </div>
        </section>
      )}

      {/* ── History table ─────────────────────────────────────────────────── */}
      <section className={`rounded-3xl border ${cardBase}`}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold">History table</h3>
            <p className={`text-sm ${mutedText}`}>
              Every submission with the latest review status and timestamp.
            </p>
          </div>
          {loadingHistory ? (
            <div className={`inline-flex items-center gap-2 text-sm ${mutedText}`}>
              <LoaderCircle className="animate-spin" size={16} />
              Loading
            </div>
          ) : (
            <div className={`inline-flex items-center gap-2 text-sm ${mutedText}`}>
              <CalendarClock size={16} />
              {submissions.length} record{submissions.length === 1 ? '' : 's'}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={isDark ? 'bg-white/5 text-gray-200' : 'bg-gray-50 text-gray-700'}>
              <tr>
                <th className="px-6 py-4 font-semibold">Assignment</th>
                <th className="px-6 py-4 font-semibold">Class</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Submitted at</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan="6" className={`px-6 py-10 text-center ${mutedText}`}>
                    Fetching your submission history...
                  </td>
                </tr>
              ) : submissions.length ? (
                submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className={isDark ? 'border-t border-white/10' : 'border-t border-gray-200'}                                            
                    onClick={() => navigate(`../submissionshistory/${submission.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold"
                      >{submission.assignmentTitle}</div>
                      <div className={subtleText}>{submission.title || 'Untitled submission'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{submission.class?.name || 'Unknown class'}</div>
                      <div className={subtleText}>
                        {[submission.class?.academicYear, submission.class?.semester]
                          .filter(Boolean)
                          .join(' • ') || 'No cycle details'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[submission.status] ||
                        (isDark
                          ? 'bg-white/10 text-white border border-white/10'
                          : 'bg-gray-100 text-gray-700 border border-gray-200')
                      }`}>
                        {submission.status?.replace('_', ' ') || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatDateTime(submission.submissionDate)}</td>
                    <td className="px-6 py-4">
                      <div>{submission.fileType || 'N/A'}</div>
                      <div className={subtleText}>
                        {(submission.submissionType || '').replace('_', ' ') || 'No type'}
                      </div>
                    </td>
                    <td className="px-6 py-4">{submission.grade ?? 'Not graded yet'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={`px-6 py-10 text-center ${mutedText}`}>
                    No submissions were found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StudentSubmissionHistory;