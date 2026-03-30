import { useState, useEffect, memo } from 'react';
import {
  GraduationCap, Users, BookOpen, Calendar,
  Layers, Mail, RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const BASE_URL = 'http://localhost:3000';

const userId = () => localStorage.getItem('userId') || '';

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const StatPill = memo(({ icon: Icon, label, value, isDark }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-red-400" />
    </div>
    <div className="min-w-0">
      <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{value || '—'}</p>
    </div>
  </div>
));
StatPill.displayName = 'StatPill';

// ─── Classmate Card ───────────────────────────────────────────────────────────

const ClassmateCard = memo(({ student, index, isDark }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
    isDark ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  }`}>
    {/* Avatar */}
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
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
        <Mail className="w-3 h-3 flex-shrink-0" />
        {student.email}
      </p>
    </div>

    <span className={`text-xs font-semibold flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
      #{index + 1}
    </span>
  </div>
));
ClassmateCard.displayName = 'ClassmateCard';

// ─── StudentClasses (Main) ────────────────────────────────────────────────────

const StudentClasses = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [classData, setClassData] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/classes/student/${userId()}`);
        if (!res.ok) throw new Error('No class found for your account');
        const data = await res.json();
        setClassData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  // ── Loading ──
  if (loading) return (
    <div className="space-y-6">
      <div className={`h-10 w-48 rounded-xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className={`h-40 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
        ))}
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className={`${card} p-12 text-center`}>
      <GraduationCap className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
      <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Not enrolled in a class
      </p>
      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{error}</p>
    </div>
  );

  const instructor = classData.instructorId;
  const classmates = classData.studentIds || [];
  // Remove current user from classmates list
  const others = classmates.filter(s => s._id !== userId());

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
          My Class
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Your enrolled class and classmates
        </p>
      </div>

      {/* Class Info Card */}
      <div className={`${card} p-6`}>

        {/* Class name + status */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {classData.name}
            </h3>
            {classData.description && (
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {classData.description}
              </p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/20 flex-shrink-0">
            Active
          </span>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatPill icon={Calendar} label="Academic Year" value={classData.academicYear} isDark={isDark} />
          <StatPill icon={Layers}   label="Semester"      value={classData.semester}     isDark={isDark} />
          <StatPill icon={Users}    label="Classmates"    value={`${others.length} enrolled`} isDark={isDark} />
        </div>
      </div>

      {/* Instructor Card */}
      {instructor && (
        <div className={`${card} p-6`}>
          <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <BookOpen className="w-3.5 h-3.5" /> Instructor
          </h4>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {(instructor.firstName?.[0] || '?').toUpperCase()}
                {(instructor.lastName?.[0]  || '').toUpperCase()}
              </span>
            </div>
            <div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {instructor.firstName} {instructor.lastName}
              </p>
              <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Mail className="w-3 h-3" />
                {instructor.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Classmates */}
      <div className={`${card} p-6`}>
        <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <Users className="w-3.5 h-3.5" />
          Classmates ({others.length}) — A-Z
        </h4>

        {others.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No other students enrolled yet.
          </p>
        ) : (
          <div className="space-y-2">
            {others.map((student, i) => (
              <ClassmateCard key={student._id} student={student} index={i} isDark={isDark} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentClasses;