import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  BarChart2, TrendingUp, Users, Mic, Brain,
  RefreshCw, AlertCircle, ChevronDown,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const BASE_URL = 'http://localhost:3000';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = memo(({ icon: Icon, label, value, sub, color, isDark }) => (
  <div className={`backdrop-blur-md rounded-2xl border p-5 transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value ?? '—'}</span>
    </div>
    <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
    {sub && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>}
  </div>
));
StatCard.displayName = 'StatCard';

// ─── Chart Card wrapper ───────────────────────────────────────────────────────
const ChartCard = memo(({ title, icon: Icon, children, isDark }) => (
  <div className={`backdrop-blur-md rounded-2xl border p-6 transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`}>
    <h3 className={`text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2 ${
      isDark ? 'text-gray-500' : 'text-gray-400'
    }`}>
      <Icon className="w-3.5 h-3.5" />
      {title}
    </h3>
    {children}
  </div>
));
ChartCard.displayName = 'ChartCard';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2 rounded-xl border shadow-xl text-xs ${
      isDark ? 'bg-gray-900 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── Student Selector ─────────────────────────────────────────────────────────
const StudentSelector = memo(({ students, selected, onSelect, isDark }) => (
  <div className="relative">
    <select
      value={selected}
      onChange={e => onSelect(e.target.value)}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm appearance-none transition-all focus:ring-2 ${
        isDark
          ? 'bg-gray-800/60 border-gray-600 text-white focus:border-red-400 focus:ring-red-400/20'
          : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
      }`}
    >
      <option value="">— Select a student —</option>
      {students.map(s => (
        <option key={s._id} value={s._id}>
          {s.firstName} {s.lastName}
        </option>
      ))}
    </select>
    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`} />
  </div>
));
StudentSelector.displayName = 'StudentSelector';

// ─── Analytics (Main) ─────────────────────────────────────────────────────────
const Analytics = ({ classId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const instructorId = localStorage.getItem('userId') || '';

  const [classStats,     setClassStats]     = useState(null);
  const [students,       setStudents]       = useState([]);
  const [selectedStudent,setSelectedStudent]= useState('');
  const [studentStats,   setStudentStats]   = useState(null);
  const [loadingClass,   setLoadingClass]   = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [error,          setError]          = useState('');

  // Use provided classId or load instructor's first class
  const [activeClassId, setActiveClassId] = useState(classId || '');
  const [classes,       setClasses]       = useState([]);

  // Load instructor's classes if no classId provided
  useEffect(() => {
    if (classId) { setActiveClassId(classId); return; }
    if (!instructorId) return;
    fetch(`${BASE_URL}/classes/instructor/${instructorId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
          setActiveClassId(data[0]._id);
        }
      })
      .catch(console.error);
  }, [classId, instructorId]);

  // Load class stats and students when activeClassId changes
  useEffect(() => {
    if (!activeClassId) return;
    setLoadingClass(true);
    setError('');

    Promise.all([
      fetch(`${BASE_URL}/ai-analyses/class/${activeClassId}/stats`).then(r => r.json()),
      fetch(`${BASE_URL}/classes/${activeClassId}/students`).then(r => r.json()),
    ])
      .then(([stats, studs]) => {
        setClassStats(stats);
        setStudents(Array.isArray(studs) ? studs : []);
      })
      .catch(() => setError('Failed to load class analytics'))
      .finally(() => setLoadingClass(false));
  }, [activeClassId]);

  // Load individual student stats when selected
  useEffect(() => {
    if (!selectedStudent) { setStudentStats(null); return; }
    setLoadingStudent(true);
    fetch(`${BASE_URL}/ai-analyses/student/${selectedStudent}/stats`)
      .then(r => r.json())
      .then(setStudentStats)
      .catch(console.error)
      .finally(() => setLoadingStudent(false));
  }, [selectedStudent]);

  // Prepare chart data
  const avgScoresData = classStats ? [
    { name: 'Pronunciation', score: classStats.averagePronunciationScore },
    { name: 'Confidence',    score: classStats.averageConfidenceScore    },
    { name: 'Speech Rate',   score: classStats.averageSpeechRate         },
  ] : [];

  const scoreDistData = classStats?.scoreDistribution?.map(d => ({
    name: d.range, value: d.count,
  })) || [];

  const fillerData = classStats?.topFillerWords?.map(f => ({
    word: f.word, count: f.count,
  })) || [];

  const historyData = studentStats?.history?.map((h, i) => ({
    name:         h.submissionTitle || `#${i + 1}`,
    Pronunciation: h.pronunciationScore,
    Confidence:    h.confidenceScore,
    SpeechRate:    h.speechRate,
  })) || [];

  const axisColor  = isDark ? '#6b7280' : '#9ca3af';
  const gridColor  = isDark ? '#ffffff15' : '#e5e7eb';
  const textColor  = isDark ? '#d1d5db' : '#374151';

  if (loadingClass) return (
    <div className="space-y-6">
      <div className={`h-10 w-64 rounded-xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className={`h-28 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />)}
      </div>
      <div className={`h-64 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
    </div>
  );

  if (error) return (
    <div className={`backdrop-blur-md rounded-2xl border p-12 text-center ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
    }`}>
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
      <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error}</p>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
            Class Analytics
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            AI speech analysis statistics for your class
          </p>
        </div>

        {/* Class Selector (if multiple classes) */}
        {classes.length > 1 && (
          <select
            value={activeClassId}
            onChange={e => setActiveClassId(e.target.value)}
            className={`px-4 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 ${
              isDark
                ? 'bg-gray-800/60 border-gray-600 text-white focus:border-red-400 focus:ring-red-400/20'
                : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
            }`}
          >
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* No data state */}
      {classStats?.totalSubmissions === 0 ? (
        <div className={`backdrop-blur-md rounded-2xl border p-12 text-center ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
        }`}>
          <Brain className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No AI analyses yet
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Analytics will appear once students submit presentations
          </p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={Users}   label="Total Submissions"     value={classStats?.totalSubmissions}          color="#ef4444" isDark={isDark} />
            <StatCard icon={Mic}     label="Avg Pronunciation"     value={`${classStats?.averagePronunciationScore}/100`} color="#3b82f6" isDark={isDark} />
            <StatCard icon={Brain}   label="Avg Confidence"        value={`${classStats?.averageConfidenceScore}/100`}    color="#10b981" isDark={isDark} />
          </div>

          {/* Average Scores Bar Chart */}
          <ChartCard title="Average Scores by Category" icon={BarChart2} isDark={isDark}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={avgScoresData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Bar dataKey="score" fill="#ef4444" radius={[6, 6, 0, 0]}>
                  {avgScoresData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Score Distribution + Top Filler Words */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Score Distribution Pie */}
            {scoreDistData.some(d => d.value > 0) && (
              <ChartCard title="Confidence Score Distribution" icon={BarChart2} isDark={isDark}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={scoreDistData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                      {scoreDistData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Top Filler Words */}
            {fillerData.length > 0 && (
              <ChartCard title="Most Used Filler Words (Class)" icon={Mic} isDark={isDark}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={fillerData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="word" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]}>
                      {fillerData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </>
      )}

      {/* Individual Student Performance */}
      <div className={`backdrop-blur-md rounded-2xl border p-6 transition-colors duration-300 ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <TrendingUp className="w-3.5 h-3.5" /> Individual Student Performance Over Time
        </h3>

        <StudentSelector
          students={students}
          selected={selectedStudent}
          onSelect={setSelectedStudent}
          isDark={isDark}
        />

        {loadingStudent && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-red-400 mr-2" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading student data...</span>
          </div>
        )}

        {!loadingStudent && studentStats && studentStats.totalSubmissions === 0 && (
          <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No AI analyses found for this student yet.
          </p>
        )}

        {!loadingStudent && studentStats && studentStats.totalSubmissions > 0 && (
          <div className="mt-5 space-y-5">
            {/* Student summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`px-3 py-3 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{studentStats.averagePronunciationScore}</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg Pronunciation</p>
              </div>
              <div className={`px-3 py-3 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{studentStats.averageConfidenceScore}</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg Confidence</p>
              </div>
              <div className={`px-3 py-3 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-lg font-bold capitalize ${
                  studentStats.trend === 'improving' ? 'text-green-400' :
                  studentStats.trend === 'declining' ? 'text-red-400' : 'text-blue-400'
                }`}>{studentStats.trend}</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Trend</p>
              </div>
            </div>

            {/* Line chart */}
            {historyData.length > 1 && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={historyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  <Legend wrapperStyle={{ color: textColor, fontSize: 12 }} />
                  <Line type="monotone" dataKey="Pronunciation" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Confidence"    stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="SpeechRate"    stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

Analytics.propTypes = {
  classId: PropTypes.string,
};

export default Analytics;
