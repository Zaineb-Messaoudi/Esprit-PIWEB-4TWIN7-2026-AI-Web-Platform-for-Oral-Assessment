import { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import {
  MessageSquare, Brain, Mic, Volume2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Save, RefreshCw, Check, X,
  Award, Lightbulb, ClipboardList,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const BASE_URL = 'http://localhost:3000';

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

// ─── Filler Badge ─────────────────────────────────────────────────────────────
const FillerBadge = memo(({ word, count, isDark }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
    isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'
  }`}>
    <span className="text-orange-400 font-semibold text-sm">"{word}"</span>
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
      isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600'
    }`}>×{count}</span>
  </div>
));
FillerBadge.displayName = 'FillerBadge';

// ─── Criterion Row (rubric criterion with progress bar) ───────────────────────
const CriterionRow = memo(({ criterion, score, isDark }) => {
  const pct = criterion.maxScore > 0
    ? Math.min(100, (score / criterion.maxScore) * 100)
    : 0;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className={`px-4 py-3 rounded-xl border ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {criterion.name}
          </p>
          {criterion.description && (
            <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {criterion.description}
            </p>
          )}
        </div>
        <span className={`text-sm font-bold ml-4 flex-shrink-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {score ?? '—'} / {criterion.maxScore}
        </span>
      </div>
      {/* Progress bar */}
      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
});
CriterionRow.displayName = 'CriterionRow';

// ─── FeedbackReport (Main) ────────────────────────────────────────────────────
const FeedbackReport = ({ submissionId, evaluationId }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [evaluation,  setEvaluation]  = useState(null);
  const [rubric,      setRubric]      = useState(null);
  const [aiAnalysis,  setAiAnalysis]  = useState(null);
  const [loadingEval, setLoadingEval] = useState(true);
  const [loadingAI,   setLoadingAI]   = useState(true);
  const [feedback,    setFeedback]    = useState('');
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [message,     setMessage]     = useState('');
  const [showAI,      setShowAI]      = useState(true);
  const [showRubric,  setShowRubric]  = useState(true);

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  // Load evaluation
  useEffect(() => {
    if (!evaluationId && !submissionId) return;
    const url = evaluationId
      ? `${BASE_URL}/evaluations/${evaluationId}`
      : `${BASE_URL}/evaluations/submission/${submissionId}`;
    fetch(url, { headers })
      .then(r => r.json())
      .then(data => {
        setEvaluation(data);
        setFeedback(data.writtenFeedback || '');
        // If evaluation has a rubricId, fetch the rubric
        if (data.rubricId && typeof data.rubricId === 'string') {
          fetch(`${BASE_URL}/rubrics/${data.rubricId}`, { headers })
            .then(r => r.json())
            .then(setRubric)
            .catch(() => setRubric(null));
        } else if (data.rubricId && typeof data.rubricId === 'object') {
          // Already populated
          setRubric(data.rubricId);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingEval(false));
  }, [evaluationId, submissionId]);

  // Load AI analysis
  useEffect(() => {
    if (!submissionId) return;
    fetch(`${BASE_URL}/ai-analyses/submission/${submissionId}`, { headers })
      .then(r => r.json())
      .then(setAiAnalysis)
      .catch(() => setAiAnalysis(null))
      .finally(() => setLoadingAI(false));
  }, [submissionId]);

  const handleSaveFeedback = useCallback(async () => {
    if (!evaluation?._id) return;
    setSaving(true); setMessage('');
    try {
      const res = await fetch(`${BASE_URL}/evaluations/${evaluation._id}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ writtenFeedback: feedback }),
      });
      if (!res.ok) throw new Error('Failed to save feedback');
      const updated = await res.json();
      setEvaluation(updated); setEditing(false);
      setMessage('Feedback saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message || 'Something went wrong');
    } finally { setSaving(false); }
  }, [evaluation, feedback]);

  const handleSubmit = useCallback(async () => {
    if (!evaluation?._id) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/evaluations/${evaluation._id}/submit`, {
        method: 'PUT',
        headers,
      });
      if (!res.ok) throw new Error('Failed to submit');
      const updated = await res.json();
      setEvaluation(updated);
      setMessage('Evaluation submitted — student can now see feedback!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { setMessage(err.message); }
    finally { setSaving(false); }
  }, [evaluation]);

  if (loadingEval) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className={`h-32 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />)}
    </div>
  );

  if (!evaluation || evaluation.statusCode === 404) return (
    <div className={`${card} p-12 text-center`}>
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
      <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        No evaluation found for this submission
      </p>
    </div>
  );

  const sub = evaluation.submissionId;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
            Evaluation Report
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {typeof sub === 'object' ? sub?.title : 'Submission'} —{' '}
            <span className={`font-semibold ${
              evaluation.status === 'submitted' ? 'text-green-400' : 'text-orange-400'
            }`}>
              {evaluation.status === 'submitted' ? 'Submitted to student' : 'Draft'}
            </span>
          </p>
        </div>
        {evaluation.status === 'draft' && (
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all hover:scale-105">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Submit to Student
          </button>
        )}
      </div>

      {/* Banner */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          message.includes('success') || message.includes('student')
            ? 'bg-green-500/15 text-green-400 border-green-500/20'
            : 'bg-red-500/15 text-red-400 border-red-500/20'
        }`}>
          {message.includes('success') || message.includes('student')
            ? <Check className="w-4 h-4 flex-shrink-0" />
            : <X className="w-4 h-4 flex-shrink-0" />}
          {message}
        </div>
      )}

      {/* Overall Scores */}
      <div className={`${card} p-6`}>
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <Award className="w-3.5 h-3.5" /> Scores
        </h3>
        <div className="flex flex-wrap justify-around gap-6">
          <ScoreRing score={evaluation.overallScore}         label="Overall Score"  color="#ef4444" isDark={isDark} />
          <ScoreRing score={aiAnalysis?.pronunciationScore} label="Pronunciation"  color="#3b82f6" isDark={isDark} />
          <ScoreRing score={aiAnalysis?.confidenceScore}    label="Confidence"     color="#10b981" isDark={isDark} />
        </div>
      </div>

      {/* Rubric Criteria — shown only when rubric is loaded */}
      {rubric && rubric.criteria?.length > 0 && (
        <div className={card}>
          <button onClick={() => setShowRubric(p => !p)}
            className="w-full flex items-center justify-between p-6 text-left">
            <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <ClipboardList className="w-3.5 h-3.5" /> Rubric: {rubric.name}
            </h3>
            {showRubric
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showRubric && (
            <div className={`px-6 pb-6 space-y-3 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="pt-4 space-y-3">
                {rubric.criteria.map((criterion, i) => {
                  // evaluation.scores is a map like { "clarity": 8, "fluency": 7 }
                  // try matching by criterion name (lowercase) or by index
                  const scoreByName = evaluation.scores?.[criterion.name]
                    ?? evaluation.scores?.[criterion.name.toLowerCase()]
                    ?? null;
                  return (
                    <CriterionRow
                      key={i}
                      criterion={criterion}
                      score={scoreByName}
                      isDark={isDark}
                    />
                  );
                })}
              </div>
              {/* Total */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border font-bold ${
                isDark ? 'bg-red-500/10 border-red-500/20 text-white' : 'bg-red-50 border-red-200 text-gray-900'
              }`}>
                <span className="text-sm">Total Score</span>
                <span className="text-sm">
                  {Object.values(evaluation.scores || {}).reduce((a, b) => a + Number(b), 0)}
                  {' / '}
                  {rubric.criteria.reduce((a, c) => a + c.maxScore, 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Written Feedback */}
      <div className={`${card} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> Written Feedback
          </h3>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isDark ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' : 'border-red-400 text-red-500 hover:bg-red-50'
              }`}>Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setFeedback(evaluation.writtenFeedback || ''); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isDark ? 'border-white/15 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}>
                <X className="w-3 h-3" /> Cancel
              </button>
              <button onClick={handleSaveFeedback} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all">
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
            rows={5} placeholder="Write your feedback for the student..."
            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 resize-none ${
              isDark
                ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:border-red-400 focus:ring-red-400/20'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20'
            }`} />
        ) : (
          <p className={`text-sm leading-relaxed ${
            evaluation.writtenFeedback
              ? isDark ? 'text-gray-200' : 'text-gray-800'
              : isDark ? 'text-gray-500 italic' : 'text-gray-400 italic'
          }`}>
            {evaluation.writtenFeedback || 'No feedback written yet. Click Edit to add feedback.'}
          </p>
        )}
      </div>

      {/* AI Analysis */}
      {!loadingAI && aiAnalysis && !aiAnalysis.message && (
        <div className={card}>
          <button onClick={() => setShowAI(p => !p)}
            className="w-full flex items-center justify-between p-6 text-left">
            <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Brain className="w-3.5 h-3.5" /> AI Speech Analysis
            </h3>
            {showAI ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showAI && (
            <div className={`px-6 pb-6 space-y-5 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="pt-4 space-y-3">
                <StatRow icon={Mic}     label="Speech Rate"        value={aiAnalysis.speechRate}             unit="wpm"    isDark={isDark} />
                <StatRow icon={Clock}   label="Pause Frequency"    value={aiAnalysis.pauseFrequency}         unit="pauses" isDark={isDark} />
                <StatRow icon={Volume2} label="Avg Pause Duration"  value={aiAnalysis.pauseDuration?.average} unit="sec"   isDark={isDark} />
              </div>

              {aiAnalysis.fillerWords?.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Filler Words
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.fillerWords.map((fw, i) => (
                      <FillerBadge key={i} word={fw.word} count={fw.count} isDark={isDark} />
                    ))}
                  </div>
                </div>
              )}

              {aiAnalysis.suggestions?.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Lightbulb className="w-3.5 h-3.5" /> AI Suggestions
                  </p>
                  <div className="space-y-2">
                    {aiAnalysis.suggestions.map((s, i) => (
                      <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                        isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <span className="text-blue-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                        <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

FeedbackReport.propTypes = {
  submissionId: PropTypes.string,
  evaluationId: PropTypes.string,
};

export default FeedbackReport;
