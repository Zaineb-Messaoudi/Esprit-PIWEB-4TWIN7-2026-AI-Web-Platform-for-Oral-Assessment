import { useState, useEffect, memo } from 'react';
import {
  GraduationCap, Users, BookOpen, Calendar,
  Layers, Mail, RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import api from '../api/axios';

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
      const { data } = await api.get('/classes/student/mine');
      console.log('RAW data:', data);
      const cls = Array.isArray(data) ? data[0] : data;
      console.log('cls:', cls);


      if (!cls) {
        setError('No class found for your account');
        return;
      }

      setClassData(cls);  // ← was setClassData(data) ❌

      if (cls._id) {
        localStorage.setItem('classId', cls._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No class found for your account');
    } finally {
      setLoading(false);
    }
  })();
}, []);
  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

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

  if (error) return (
    <div className={`${card} p-12 text-center`}>
      <GraduationCap className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
      <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Not enrolled in a class
      </p>
      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{error}</p>
    </div>
  );

  const currentUserId = localStorage.getItem('userId') || '';
  const instructor    = classData.instructorId;
  const classmates    = classData.studentIds || [];
  // Remove current student from the list so they don't see themselves
  const others = classmates.filter(s => (s._id ?? s) !== currentUserId);

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
              <ClassmateCard
                key={student._id ?? student}
                student={typeof student === 'string' ? { _id: student, firstName: '?', lastName: '', email: '' } : student}
                index={i}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClasses;