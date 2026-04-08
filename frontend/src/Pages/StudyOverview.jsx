import { useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const StudyOverview = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {}, []);

  const progress = [
    { subject: 'Informatique', percentage: 0 },
    { subject: 'Anglais',      percentage: 0 },
    { subject: 'Chimie',       percentage: 22.23 },
    { subject: 'Analyse',      percentage: 4.88 },
    { subject: 'Algèbre',      percentage: 7.22 },
  ];

  const freeVideos = [
    { title: '01_Techniques en Analyse (ancien)', instructor: 'Wissem', date: '01-10-2016' },
    { title: '01_Techniques en Analyse (ancien)', instructor: 'Wissem', date: '01-10-2016' },
  ];

  // ── Shared token shorthands ──────────────────────────────────────────────
  const card = isDark
      ? 'bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg'
      : 'bg-red-100 border border-red-300 rounded-xl shadow-md';

  const cardAlt = isDark
      ? 'bg-gray-900/40 border border-gray-700 rounded-xl shadow-lg'
      : 'bg-red-100 border border-red-300 rounded-xl shadow-md';

  const textPrimary   = isDark ? 'text-white'     : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400'  : 'text-gray-600';
  const textMuted     = isDark ? 'text-gray-300'  : 'text-gray-700';
  const accent        = isDark ? 'text-red-400'   : 'text-red-700';
  const trackBg       = isDark ? 'bg-gray-700'    : 'bg-red-200';

  return (
      <div className="min-h-screen relative text-gray-200 overflow-hidden">

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">

          {/* ── Title ─────────────────────────────────────────────────────── */}
          <div className="text-center mb-10">
            <h1 className={`text-4xl font-bold text-transparent bg-clip-text ${
                isDark
                    ? 'bg-gradient-to-r from-red-400 to-gray-400'
                    : 'bg-gradient-to-r from-red-600 to-gray-600'
            }`}>
              Study Dashboard
            </h1>
            <p className={`mt-2 ${textSecondary}`}>
              Track your learning journey and access helpful resources
            </p>
          </div>

          {/* ── Live Sessions & Latest Assignments ────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

            <div className={`p-6 ${card}`}>
              <div className={`flex items-center gap-2 mb-4 font-semibold ${accent}`}>
                <CalendarDays className="w-5 h-5" />
                <span>This week timetable</span>
              </div>
              <p className={textSecondary}>Your Class</p>
            </div>

            <div className={`p-6 ${card}`}>
              <div className={`flex items-center gap-2 mb-4 font-semibold ${accent}`}>
                <span>📋</span>
                <span>Latest Assignments</span>
              </div>
              <p className={textSecondary}>Subject Name</p>
            </div>

          </div>

          {/* ── Suggested Courses ─────────────────────────────────────────── */}
          <div className="mb-12">
            <h2 className={`text-2xl font-semibold mb-4 ${accent}`}>
              Suggested Courses
            </h2>
            <div className="space-y-4">
              {freeVideos.map((video, idx) => (
                  <div key={idx} className={`p-4 ${cardAlt}`}>
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>
                      {video.title}
                    </h3>
                    <p className={`text-sm mt-1 ${textSecondary}`}>
                      By {video.instructor} — {video.date}
                    </p>
                  </div>
              ))}
            </div>
          </div>

          {/* ── My Progress ───────────────────────────────────────────────── */}
          <div className="mb-12">
            <h2 className={`text-2xl font-semibold mb-6 ${accent}`}>
              My Progress
            </h2>
            <div className="space-y-4">
              {progress.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className={textMuted}>{item.subject}</span>
                      <span className={`font-medium ${accent}`}>{item.percentage}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${trackBg}`}>
                      <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                              isDark
                                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
              ))}
            </div>
          </div>

        </div>
      </div>
  );
};

export default StudyOverview;