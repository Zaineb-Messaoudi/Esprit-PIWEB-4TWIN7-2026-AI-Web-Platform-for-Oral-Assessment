import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlertCircle,
  Award,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Mic,
  RefreshCw,
  Save,
  Sparkles,
  Star,
  Volume2,
  Wand2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { api } from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import AIAnalysisReport from './AIAnalysisReport.jsx';


// ─── Pure helpers ─────────────────────────────────────────────────────────────

const normalizeKey = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const round = (value) => Math.round(value * 100) / 100;
const roundHalf = (value) => Math.round(value * 2) / 2;

// ─── ScoreRing ────────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color, isDark }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const numericScore = Number.isFinite(score) ? score : 0;
  const progress = (Math.max(0, Math.min(100, numericScore)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} strokeWidth="8" fill="none"
            className={isDark ? 'stroke-white/10' : 'stroke-gray-200'} />
          <circle cx="48" cy="48" r={radius} strokeWidth="8" fill="none"
            stroke={color} strokeDasharray={circumference}
            strokeDashoffset={circumference - progress} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {Number.isFinite(score) ? score : '—'}
          </span>
        </div>
      </div>
      <span className={`text-center text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

// ─── StatRow ──────────────────────────────────────────────────────────────────

function StatRow({ icon: Icon, label, value, unit, isDark }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
          <Icon className="h-4 w-4 text-red-400" />
        </div>
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {label}
        </span>
      </div>
      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value ?? '—'}{unit ? <span className="ml-1 text-xs font-normal">{unit}</span> : null}
      </span>
    </div>
  );
}

// ─── CriterionEditorRow ───────────────────────────────────────────────────────

function CriterionEditorRow({ criterion, rowState, comment, isDark, onChange, onCommentChange }) {
  const [showComment, setShowComment] = useState(!!comment);

  const invalid =
    rowState.instructorRaw !== '' &&
    (Number.isNaN(rowState.instructorScore) ||
      rowState.instructorScore < 0 ||
      rowState.instructorScore > criterion.maxScore);

  return (
    <div className={`rounded-2xl border p-4 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Header + score input */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {criterion.name}
            </p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isDark ? 'bg-white/10 text-gray-300' : 'bg-white text-gray-600'
            }`}>
              Max {criterion.maxScore}
            </span>
            {rowState.overrideApplied ? (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                Override applied
              </span>
            ) : null}
          </div>
          {criterion.description ? (
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {criterion.description}
            </p>
          ) : null}
        </div>

        <label className="w-full max-w-[180px] space-y-1 text-sm">
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Instructor score</span>
          <input
            type="number"
            min="0"
            max={criterion.maxScore}
            step="0.1"
            value={rowState.instructorRaw}
            onChange={(e) => onChange(criterion, e.target.value)}
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
              invalid
                ? 'border-red-400 bg-red-500/10 text-red-100'
                : isDark
                  ? 'border-white/10 bg-black/20 text-white'
                  : 'border-gray-200 bg-white text-gray-900'
            }`}
            placeholder={rowState.aiScore ?? '0'}
          />
          {invalid ? (
            <p className="text-xs text-red-400">Enter 0 – {criterion.maxScore}.</p>
          ) : null}
        </label>
      </div>

      {/* Score breakdown */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'AI suggested', value: rowState.aiScore,
            cls: isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50',
            textCls: isDark ? 'text-blue-300' : 'text-blue-700' },
          { label: 'Instructor',   value: rowState.instructorRaw === '' ? null : rowState.instructorScore,
            cls: isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white',
            textCls: isDark ? 'text-gray-400' : 'text-gray-500' },
          { label: 'Final',        value: rowState.finalScore,
            cls: isDark ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50',
            textCls: isDark ? 'text-emerald-300' : 'text-emerald-700' },
        ].map(({ label, value, cls, textCls }) => (
          <div key={label} className={`rounded-xl border px-3 py-3 ${cls}`}>
            <p className={`text-[11px] font-bold uppercase tracking-widest ${textCls}`}>{label}</p>
            <p className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Per-criterion comment */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowComment((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold transition ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <MessageSquare size={12} />
          {showComment ? 'Hide comment' : comment ? 'Edit comment' : 'Add comment'}
        </button>

        {showComment ? (
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => onCommentChange(criterion, e.target.value)}
            placeholder={`Comment on "${criterion.name}"…`}
            className={`mt-2 w-full resize-none rounded-xl border px-3 py-2 text-xs outline-none transition ${
              isDark
                ? 'border-white/10 bg-black/20 text-white placeholder:text-gray-500'
                : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
            }`}
          />
        ) : comment ? (
          <p className={`mt-1.5 text-xs italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            "{comment}"
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── State builders ───────────────────────────────────────────────────────────

const buildStateFromEvaluation = (rubric, evaluation) =>
  Object.fromEntries(
    (rubric?.criteria ?? []).map((criterion) => {
      const key = criterion.key ?? normalizeKey(criterion.name);
      const criterionScore =
        evaluation?.criterionScores?.find((item) => item.key === key)
      const legacyScore =
        evaluation?.scores?.[criterion.name] ??
        evaluation?.scores?.[criterion.name.toLowerCase()] ??
        '';

      const instructorScore = criterionScore?.instructorScore;
      return [
        key,
        instructorScore != null
          ? String(instructorScore)
          : String(legacyScore === '' ? '' : legacyScore),
      ];
    }),
  );

const buildCommentsFromEvaluation = (rubric, evaluation) => {
  const map = {};
  (rubric?.criteria ?? []).forEach((criterion) => {
    const key = criterion.key ?? normalizeKey(criterion.name);
    const cs =
      evaluation?.criterionScores?.find((item) => item.key === key) ??
      evaluation?.criterionScores?.find((item) => normalizeKey(item.name) === key);
    if (cs?.comments) map[key] = cs.comments;
  });
  return map;
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function FeedbackReport({
  submissionId: propSubmissionId,
  evaluationId: propEvaluationId,
  onEvaluationSaved,
}) {
  const params   = useParams();
  const navigate = useNavigate();

  const submissionId = propSubmissionId || params.id;
  const evaluationId = propEvaluationId || params.evaluationId;

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ── Core data ─────────────────────────────────────────────────────────────
  const [evaluation, setEvaluation]             = useState(null);
  const [rubric, setRubric]                     = useState(null);
  const [aiAnalysis, setAiAnalysis]             = useState(null);
  const [availableRubrics, setAvailableRubrics] = useState([]);
  const [selectedRubricId, setSelectedRubricId] = useState('');

  // ── Instructor input ──────────────────────────────────────────────────────
  const [criterionInputs,   setCriterionInputs]   = useState({});
  const [criterionComments, setCriterionComments] = useState({});
  const [feedback,          setFeedback]          = useState('');
  const [grade,             setGrade]             = useState('');
  const [targetStatus,      setTargetStatus]      = useState('graded');

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(true);
  const [loadingAI,   setLoadingAI]   = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [message,     setMessage]     = useState('');
  const [showRubric,  setShowRubric]  = useState(true);
  const [showAI,      setShowAI]      = useState(true);
  const [error,       setError]       = useState('');

  const card = `rounded-3xl border backdrop-blur-md transition-colors duration-300 ${
    isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/80'
  }`;
  const subtleText = isDark ? 'text-gray-400' : 'text-gray-500';

  // ── Load evaluation ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!submissionId && !evaluationId) { setLoading(false); return; }
      setLoading(true);
      setError('');

      try {
        const { data } = evaluationId
          ? await api.get(`/evaluations/${evaluationId}`)
          : await api.get(`/evaluations/submission/${submissionId}`);

        if (cancelled) return;

        const resolvedRubric =
          data?.rubricId && typeof data.rubricId === 'object' ? data.rubricId : null;

        setEvaluation(data);
        setRubric(resolvedRubric);
        setSelectedRubricId(resolvedRubric?._id ?? data?.rubricId ?? '');
        setFeedback(data?.writtenFeedback ?? '');
        setCriterionInputs(buildStateFromEvaluation(resolvedRubric, data));
        setCriterionComments(buildCommentsFromEvaluation(resolvedRubric, data));
        setGrade(data?.manualGrade != null ? String(data.manualGrade) : '');
        setTargetStatus(data?.targetSubmissionStatus ?? 'graded');
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 404 && submissionId) {
          setEvaluation(null);
          setRubric(null);
          setFeedback('');
          setCriterionInputs({});
          setCriterionComments({});
          setGrade('');
          setTargetStatus('graded');

          try {
            const { data } = await api.get(`/evaluations/submission/${submissionId}/rubrics`);
            if (cancelled) return;
            const rubrics = Array.isArray(data) ? data : [];
            setAvailableRubrics(rubrics);
            if (rubrics.length) {
              setSelectedRubricId(rubrics[0]._id);
              setRubric(rubrics[0]);
            }
          } catch {
            if (!cancelled) setAvailableRubrics([]);
          }
        } else {
          setError(err.response?.data?.message || 'Unable to load this evaluation.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [evaluationId, submissionId]);

  // ── Load AI analysis ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!submissionId) { setLoadingAI(false); return; }
      setLoadingAI(true);
      try {
        const { data: responseData } = await api.get(`/ai-analyses/submission/${submissionId}`);
        if (!cancelled) {
          // responseData shape: { status: '...', data: {...} | null }
          // Only set if completed and data exists
          if (responseData?.status === 'completed' && responseData?.data) {
            setAiAnalysis(responseData.data);
          } else {
            setAiAnalysis(null);
          }
        }
      } catch {
        if (!cancelled) setAiAnalysis(null);
      } finally {
        if (!cancelled) setLoadingAI(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [submissionId]);

  // ── Rubric selection ──────────────────────────────────────────────────────
  const handleRubricChange = (id) => {
    setSelectedRubricId(id);
    const selected = availableRubrics.find((r) => r._id === id);
    if (selected) {
      setRubric(selected);
      if (!evaluation) {
        setCriterionInputs({});
        setCriterionComments({});
      }
    }
  };

  // ── Derived criterion state ───────────────────────────────────────────────
  const criterionState = useMemo(() => {
    if (!rubric?.criteria?.length) return [];

    return rubric.criteria.map((criterion) => {
      const key = criterion.key;

      const source =
        evaluation?.criterionScores?.find((item) => item.key === key) ?? null;

      const instructorRaw = criterionInputs?.[key];

      const parsed =
        instructorRaw === undefined ||
        instructorRaw === null ||
        instructorRaw === ''
          ? null
          : Number.parseFloat(instructorRaw);

      const instructorScore =
        parsed === null || Number.isNaN(parsed) ? null : round(parsed);

      const aiScore = source?.aiScore ?? null;

      const finalScore = instructorScore ?? aiScore ?? null;

      const invalid =
        instructorRaw !== undefined &&
        instructorRaw !== null &&
        instructorRaw !== '' &&
        (instructorScore === null ||
          instructorScore < 0 ||
          instructorScore > criterion.maxScore);

      const overrideApplied =
        aiScore !== null &&
        instructorScore !== null &&
        Math.abs(instructorScore - aiScore) > 0.01;

      return {
        key,
        criterion,
        aiScore,
        instructorRaw,
        instructorScore,
        finalScore,
        invalid,
        overrideApplied,
      };
    });
  }, [criterionInputs, evaluation?.criterionScores, rubric]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    if (!rubric?.criteria?.length) return null;
    const maxScore        = rubric.criteria.reduce((s, c) => s + c.maxScore, 0);
    const finalScore      = criterionState.reduce((s, i) => s + (i.finalScore ?? 0), 0);
    const aiScore         = criterionState.reduce((s, i) => s + (i.aiScore ?? 0), 0);
    const instructorScore = criterionState.reduce((s, i) => s + (i.instructorScore ?? 0), 0);

    // Average AI score across criteria that have an AI score
    const validAiScores = criterionState.filter((i) => i.aiScore !== null);
    const avgAiScore =
      validAiScores.length > 0
        ? round(validAiScores.reduce((s, i) => s + (i.aiScore ?? 0), 0) / validAiScores.length)
        : 0;

    return {
      maxScore:        round(maxScore),
      finalScore:      round(finalScore),
      aiScore:         round(aiScore),
      avgAiScore,
      instructorScore: round(instructorScore),
      overallPercent:  maxScore > 0 ? round((finalScore / maxScore) * 100) : 0,
    };
  }, [criterionState, rubric]);

  const computedGrade20 = useMemo(() => {
    if (!totals?.maxScore) return null;
    return roundHalf((totals.finalScore / totals.maxScore) * 20);
  }, [totals]);

  // ── Save guards ───────────────────────────────────────────────────────────
  const canSave = useMemo(() => {
    if (!selectedRubricId && !evaluation) return false;
    if (!grade) return false;
    const g = parseFloat(grade);
    if (Number.isNaN(g) || g < 0 || g > 20) return false;
    return criterionState.every((item) => !item.invalid);
  }, [grade, criterionState, selectedRubricId, evaluation]);

  // ── Hydrate from server response ──────────────────────────────────────────
  const hydrateFromEvaluation = (next) => {
    const nextRubric =
      next?.rubricId && typeof next.rubricId === 'object' ? next.rubricId : rubric;

    setEvaluation(next);
    if (nextRubric) {
      setRubric(nextRubric);
      setSelectedRubricId(nextRubric._id);
      setCriterionInputs(buildStateFromEvaluation(nextRubric, next));
      setCriterionComments(buildCommentsFromEvaluation(nextRubric, next));
    }
    setFeedback(next?.writtenFeedback ?? '');
    setGrade(next?.manualGrade != null ? String(next.manualGrade) : '');
    setTargetStatus(next?.targetSubmissionStatus ?? 'graded');
    onEvaluationSaved?.(next);
  };

  // ── Payload ───────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    submissionId,
    rubricId: selectedRubricId,
    writtenFeedback: feedback,
    grade: grade !== '' ? parseFloat(grade) : undefined,
    targetSubmissionStatus: targetStatus,
    aiInsightsUsed: !!aiAnalysis,
    criterionScores: criterionState.map((item) => ({
      key: item.key,
      name: item.criterion.name,
      description: item.criterion.description,
      maxScore: item.criterion.maxScore,

      ...(item.instructorScore != null && {
        instructorScore: item.instructorScore,
      }),

      finalScore: item.finalScore,

      ...(item.overrideApplied && {
        overrideReason: 'Instructor override applied in evaluation UI',
      }),

      ...(criterionComments[item.key] && {
        comments: criterionComments[item.key],
      }),
    }))
  });

  const saveDraft = async () => {
    if (!canSave) return null;
    const payload  = buildPayload();
    const response = evaluation?._id
      ? await api.put(`/evaluations/${evaluation._id}`, payload)
      : await api.post('/evaluations', payload);
    hydrateFromEvaluation(response.data);
    return response.data;
  };

  const handleSaveDraft = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      await saveDraft();
      setMessage('Draft saved successfully.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save the evaluation draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      const draft = await saveDraft();
      if (!draft?._id) throw new Error('The draft could not be created.');
      const { data } = await api.put(`/evaluations/${draft._id}/submit`);
      hydrateFromEvaluation(data);
      setMessage('Evaluation submitted. The student can now view their results.');
      setTimeout(() => navigate(`../submissions/${submissionId}`), 2000);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to submit the evaluation.');
    } finally {
      setSaving(false);
    }
  };

  const handleCriterionChange = (criterion, value) => {
    const key = criterion.key ?? normalizeKey(criterion.name);
    setCriterionInputs((c) => ({ ...c, [key]: value }));
  };

  const handleCommentChange = (criterion, value) => {
    const key = criterion.key ?? normalizeKey(criterion.name);
    setCriterionComments((c) => ({ ...c, [key]: value }));
  };

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className={`h-40 animate-pulse rounded-3xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${card} p-6`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
          <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
        </div>
      </div>
    );
  }

  if (!evaluation && !submissionId) return null;

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header / action bar ───────────────────────────────────── */}
      <div className={`${card} p-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">
              <Sparkles className="h-3.5 w-3.5" />
              Evaluation workspace
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Rubric-driven evaluation
            </h3>
            <p className={`mt-2 text-sm ${subtleText}`}>
              Score each criterion, add comments, set a final grade and submit.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {evaluation?.status === 'submitted' ? 'Update evaluation' : 'Submit evaluation'}
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        ) : null}
      </div>

      {/* ── Rubric picker (no evaluation yet) ────────────────────── */}
      {!evaluation && !rubric ? (
        <div className={`${card} p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15">
              <Wand2 className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Choose a rubric
              </h4>
              <p className={`text-sm ${subtleText}`}>
                Rubrics marked <span className="font-semibold text-amber-300">Recommended</span> are linked to this assignment.
              </p>
            </div>
          </div>

          {availableRubrics.length ? (
            <div className="space-y-2">
              {availableRubrics.map((item) => (
                <label
                  key={item._id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    selectedRubricId === item._id
                      ? isDark ? 'border-red-400/40 bg-red-500/10' : 'border-red-300 bg-red-50'
                      : isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rubric"
                    value={item._id}
                    checked={selectedRubricId === item._id}
                    onChange={() => handleRubricChange(item._id)}
                    className="mt-0.5 accent-red-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.name}
                      </span>
                      {item.isRecommended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          <Star size={9} />
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className={`mt-0.5 text-xs ${subtleText}`}>{item.description}</p>
                    ) : null}
                    <p className={`mt-1 text-[11px] ${subtleText}`}>
                      {item.criteria?.length ?? 0} criteria · Max{' '}
                      {item.criteria?.reduce((s, c) => s + c.maxScore, 0) ?? 0} pts
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              No rubric available yet. Create one first, then come back to score this submission.
            </div>
          )}
        </div>
      ) : null}

      {/* ── Score overview (once rubric is selected) ──────────────── */}
      {rubric ? (
        <>
          <div className={`${card} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${subtleText}`}>Active rubric</p>
                <h4 className={`mt-1 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {rubric.name}
                </h4>
                {rubric.description ? (
                  <p className={`mt-1 text-sm ${subtleText}`}>{rubric.description}</p>
                ) : null}
              </div>

              {totals ? (
                <div className="flex flex-wrap justify-center gap-6">
                  <ScoreRing score={totals.overallPercent} label="Overall %" color="#ef4444" isDark={isDark} />
                  <ScoreRing
                    score={totals.avgAiScore}
                    label="AI avg score"
                    color="#3b82f6"
                    isDark={isDark}
                  />
                  <ScoreRing
                    score={totals.maxScore > 0 ? round((totals.instructorScore / totals.maxScore) * 100) : 0}
                    label="Instructor %"
                    color="#10b981"
                    isDark={isDark}
                  />
                </div>
              ) : null}
            </div>

            {totals ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['AI avg score',      totals.avgAiScore],
                  ['Instructor total',  totals.instructorScore],
                  ['Final total',       totals.finalScore],
                ].map(([label, value]) => (
                  <div key={label} className={`rounded-2xl border px-4 py-4 ${
                    isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${subtleText}`}>{label}</p>
                    <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {value}{' '}
                      {label === 'Final total' && (
                        <span className={`text-sm font-medium ${subtleText}`}>/ {totals.maxScore}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Grade & Status ─────────────────────────────────────── */}
          <div className={`${card} p-6`}>
            <div className="mb-5 flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10' : 'bg-red-50'}`}>
                <GraduationCap className={isDark ? 'text-red-200' : 'text-red-600'} size={20} />
              </div>
              <div>
                <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Grade & Submission Status
                </h4>
                <p className={`text-xs ${subtleText}`}>
                  Set the final 0-20 grade and the status applied to the submission on submit.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Grade */}
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`mb-1 text-xs font-bold uppercase tracking-widest ${subtleText}`}>
                  Final grade (0 – 20)
                </p>
                {computedGrade20 !== null ? (
                  <p className={`mb-3 text-xs ${subtleText}`}>
                    Rubric suggestion:{' '}
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {computedGrade20} / 20
                    </span>
                  </p>
                ) : null}
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder={computedGrade20 != null ? String(computedGrade20) : 'Enter grade…'}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
                    isDark
                      ? 'border-white/10 bg-black/20 text-white placeholder:text-gray-500'
                      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
                  }`}
                  required
                />
                {computedGrade20 !== null && grade !== '' && parseFloat(grade) !== computedGrade20 ? (
                  <p className={`mt-1.5 text-xs ${subtleText}`}>
                    Manual override: <span className="font-semibold text-amber-400">{grade} / 20</span>
                  </p>
                ) : (
                  <p className={`mt-1.5 text-xs ${subtleText}`}>
                    Leave empty to use the rubric-derived grade.
                  </p>
                )}
              </div>

              {/* Status */}
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`mb-1 text-xs font-bold uppercase tracking-widest ${subtleText}`}>
                  Submission status after submit
                </p>
                <p className={`mb-3 text-xs ${subtleText}`}>
                  Applied to the student's submission when this evaluation is submitted.
                </p>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
                    isDark
                      ? 'border-white/10 bg-black/20 text-white'
                      : 'border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  <option value="graded">Graded</option>
                  <option value="pending">Pending (keep open)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Criterion scoring ──────────────────────────────────── */}
          <div className={card}>
            <button
              onClick={() => setShowRubric((v) => !v)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${subtleText}`}>
                <ClipboardList className="h-3.5 w-3.5" />
                Criterion scoring
              </h4>
              {showRubric
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {showRubric ? (
              <div className={`space-y-4 border-t px-6 pb-6 pt-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                {criterionState.map((item) => (
                  <CriterionEditorRow
                    key={item.key}
                    criterion={item.criterion}
                    rowState={item}
                    comment={criterionComments[item.key] ?? ''}
                    isDark={isDark}
                    onChange={handleCriterionChange}
                    onCommentChange={handleCommentChange}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Written feedback ───────────────────────────────────── */}
          <div className={`${card} p-6`}>
            <h4 className={`mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${subtleText}`}>
              <MessageSquare className="h-3.5 w-3.5" />
              Overall written feedback
            </h4>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              placeholder="Highlight strengths, explain the grade, point to areas for improvement, and offer guidance for future work."
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                isDark
                  ? 'border-white/10 bg-black/20 text-white placeholder:text-gray-500'
                  : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
              }`}
            />
          </div>

          {/* ── AI insights ────────────────────────────────────────── */}
          {!loadingAI && aiAnalysis ? (
            <div className={card}>
              <button
                onClick={() => setShowAI((v) => !v)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${subtleText}`}>
                  <Brain className="h-3.5 w-3.5" />
                  AI evidence used in scoring
                </h4>
                {showAI ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showAI ? (
                <div className={`border-t px-6 pb-6 pt-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <AIAnalysisReport analysis={aiAnalysis} editable compact />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

    </div>
  );
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

ScoreRing.propTypes = {
  score: PropTypes.number,
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  isDark: PropTypes.bool.isRequired,
};

StatRow.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  unit: PropTypes.string,
  isDark: PropTypes.bool.isRequired,
};

CriterionEditorRow.propTypes = {
  criterion: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    maxScore: PropTypes.number.isRequired,
  }).isRequired,
  rowState: PropTypes.shape({
    aiScore: PropTypes.number,
    instructorRaw: PropTypes.string.isRequired,
    instructorScore: PropTypes.number,
    finalScore: PropTypes.number,
    overrideApplied: PropTypes.bool.isRequired,
  }).isRequired,
  comment: PropTypes.string,
  isDark: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onCommentChange: PropTypes.func.isRequired,
};

FeedbackReport.propTypes = {
  submissionId: PropTypes.string,
  evaluationId: PropTypes.string,
  onEvaluationSaved: PropTypes.func,
};