import { useState, useEffect, memo } from 'react';
import {
  Award, MessageSquare, Brain, Mic, Volume2, Clock,
  Lightbulb, TrendingUp, TrendingDown, Minus, AlertCircle,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { api } from '../utils/api';
import AIAnalysisReport from './AIAnalysisReport.jsx';

// ─── Score Ring ───────────────────────────────────────────────────────────────
const ScoreRing = memo(({ score, label, color, isDark }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = ((score || 0) / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} strokeWidth="8" fill="none"
            className={isDark ? 'stroke-white/10' : 'stroke-gray-200'} />
          <circle cx="48" cy="48" r={radius} strokeWidth="8" fill="none"
            stroke={color} strokeDasharray={circumference}
            strokeDashoffset={circumference - progress} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {score ?? '—'}
          </span>
        </div>
      </div>
      <span className={`text-xs font-semibold text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
});
ScoreRing.displayName = 'ScoreRing';

// ─── Stat Row ─────────────────────────────────────────────────────────────────
const StatRow = memo(({ icon: Icon, label, value, unit, isDark }) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-red-400" />
      </div>
      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
    </div>
    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {value ?? '—'} {unit && <span className="text-xs font-normal">{unit}</span>}
    </span>
  </div>
));
StatRow.displayName = 'StatRow';

// ─── Trend Badge ──────────────────────────────────────────────────────────────
const TrendBadge = memo(({ trend }) => {
  const config = {
    improving: { icon: TrendingUp,   color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/20', label: 'Improving' },
    declining: { icon: TrendingDown, color: 'text-red-400',   bg: 'bg-red-500/15 border-red-500/20',     label: 'Needs Work' },
    stable:    { icon: Minus,        color: 'text-blue-400',  bg: 'bg-blue-500/15 border-blue-500/20',   label: 'Stable'    },
  };
  const c = config[trend] || config.stable;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.color}`}>
      <Icon className="w-3 h-3" />{c.label}
    </span>
  );
});
TrendBadge.displayName = 'TrendBadge';

// ─── StudentReport (Main) ─────────────────────────────────────────────────────
const StudentReport = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const studentId = localStorage.getItem('userId') || '';

  const [evaluations, setEvaluations] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState(null);
  const [showAI,      setShowAI]      = useState({});

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  useEffect(() => {
    if (!studentId) return;
    Promise.all([
      api.get(`/evaluations/student/${studentId}`).then((response) => response.data),
      api.get(`/ai-analyses/student/${studentId}/stats`).then((response) => response.data),
    ])
      .then(([evals, st]) => {
        setEvaluations(Array.isArray(evals) ? evals : []);
        setStats(st);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className={`h-32 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />)}
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
          My Performance Reports
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Your evaluation results and AI speech analysis
        </p>
      </div>

      {/* Overall Stats */}
      {stats && stats.totalSubmissions > 0 && (
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <TrendingUp className="w-3.5 h-3.5" /> My Performance Overview
            </h3>
            <TrendBadge trend={stats.trend} />
          </div>
          <div className="flex flex-wrap justify-around gap-6">
            <ScoreRing score={stats.averagePronunciationScore} label="Avg Pronunciation" color="#3b82f6" isDark={isDark} />
            <ScoreRing score={stats.averageConfidenceScore}    label="Avg Confidence"    color="#10b981" isDark={isDark} />
            <ScoreRing score={stats.averageSpeechRate}         label="Avg Speech Rate"   color="#f59e0b" isDark={isDark} />
          </div>
          <div className={`mt-4 px-4 py-2.5 rounded-xl border text-center ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Based on <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalSubmissions}</span> submission{stats.totalSubmissions !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Evaluations List */}
      {evaluations.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No evaluations yet
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Your instructor hasn't submitted any evaluations yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => {
            const sub = ev.submissionId;
            const isOpen = expanded === ev._id;
            return (
              <div key={ev._id} className={card}>

                {/* Card Header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : ev._id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-red-500/15' : 'bg-red-50'
                    }`}>
                      <Award className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {typeof sub === 'object' ? sub?.title : 'Submission'}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(ev.evaluationDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {ev.overallScore ?? '—'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/ 100</p>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isOpen && (
                  <div className={`px-5 pb-5 space-y-5 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>

                    {/* Written Feedback */}
                    <div className="pt-4">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <MessageSquare className="w-3.5 h-3.5" /> Instructor Feedback
                      </p>
                      <div className={`px-4 py-3 rounded-xl border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          {ev.writtenFeedback || 'No written feedback provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Criterion Scores */}
                    {ev.scores && Object.keys(ev.scores).length > 0 && (
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Criterion Scores
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(ev.scores).map(([key, val]) => (
                            <div key={key} className={`px-3 py-3 rounded-xl border text-center ${
                              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                            }`}>
                              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{val}</p>
                              <p className={`text-xs capitalize mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{key}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Analysis toggle */}
                    {typeof sub === 'object' && sub?._id && (
                    <AIAnalysisSectionWrapper
                      submissionId={sub._id}
                      isDark={isDark}
                      isOpen={showAI[ev._id]}
                      onToggle={() => setShowAI(p => ({ ...p, [ev._id]: !p[ev._id] }))}
                    />
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

// ─── AI Analysis Section (lazy loaded per evaluation) ────────────────────────
const AIAnalysisSectionWrapper = memo(({ submissionId, isDark, isOpen, onToggle }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || loaded) return;
    api.get(`/ai-analyses/submission/${submissionId}`)
      .then(r => { setAnalysis(r.data); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, [isOpen, submissionId, loaded]);

  const card = `rounded-xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`;

  return (
    <div className={card}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <Brain className="w-3.5 h-3.5" /> AI Speech Analysis
        </p>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          {!loaded ? (
            <div className="pt-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className={`h-12 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />)}
            </div>
          ) : !analysis ? (
            <p className={`text-sm pt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No AI analysis available yet.
            </p>
          ) : (
            <div className="pt-3">
              <AIAnalysisReport analysis={analysis} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
AIAnalysisSectionWrapper.displayName = 'AIAnalysisSectionWrapper';

export default StudentReport;