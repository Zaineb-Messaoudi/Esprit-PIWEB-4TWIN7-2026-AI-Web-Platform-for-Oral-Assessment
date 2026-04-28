import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {AlertCircle,Award,Brain,Check,ChevronDown,ChevronUp,ClipboardList,Lightbulb,MessageSquare,Mic,RefreshCw,Save,Sparkles,Volume2,Wand2,} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { api } from '../utils/api';

const normalizeKey = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const round = (value) => Math.round(value * 100) / 100;

function ScoreRing({ score, label, color, isDark }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const numericScore = Number.isFinite(score) ? score : 0;
  const progress = (Math.max(0, Math.min(100, numericScore)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="8"
            fill="none"
            className={isDark ? 'stroke-white/10' : 'stroke-gray-200'}
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            strokeWidth="8"
            fill="none"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
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

function StatRow({ icon: Icon, label, value, unit, isDark }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
          <Icon className="h-4 w-4 text-red-400" />
        </div>
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {label}
        </span>
      </div>
      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value ?? '—'} {unit ? <span className="text-xs font-normal">{unit}</span> : null}
      </span>
    </div>
  );
}

function CriterionEditorRow({
  criterion,
  rowState,
  isDark,
  onChange,
}) {
  const invalid =
    rowState.instructorRaw !== '' &&
    (Number.isNaN(rowState.instructorScore) ||
      rowState.instructorScore < 0 ||
      rowState.instructorScore > criterion.maxScore);

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {criterion.name}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isDark ? 'bg-white/10 text-gray-300' : 'bg-white text-gray-600'
              }`}
            >
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
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            Instructor score
          </span>
          <input
            type="number"
            min="0"
            max={criterion.maxScore}
            step="0.1"
            value={rowState.instructorRaw}
            onChange={(event) => onChange(criterion, event.target.value)}
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
            <p className="text-xs text-red-400">
              Enter a score between 0 and {criterion.maxScore}.
            </p>
          ) : null}
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div
          className={`rounded-xl border px-3 py-3 ${
            isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50'
          }`}
        >
          <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            AI suggested
          </p>
          <p className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {rowState.aiScore ?? '—'}
          </p>
        </div>

        <div
          className={`rounded-xl border px-3 py-3 ${
            isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'
          }`}
        >
          <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Instructor
          </p>
          <p className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {rowState.instructorRaw === '' ? '—' : rowState.instructorScore}
          </p>
        </div>

        <div
          className={`rounded-xl border px-3 py-3 ${
            isDark ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            Final
          </p>
          <p className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {rowState.finalScore ?? '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

const buildStateFromEvaluation = (rubric, evaluation) =>
  Object.fromEntries(
    (rubric?.criteria ?? []).map((criterion) => {
      const key = normalizeKey(criterion.name);
      const criterionScore =
        evaluation?.criterionScores?.find((item) => item.key === key) ??
        evaluation?.criterionScores?.find(
          (item) => normalizeKey(item.name) === key,
        );

      const legacyScore =
        evaluation?.scores?.[criterion.name] ??
        evaluation?.scores?.[criterion.name.toLowerCase()] ??
        '';

      const instructorScore = criterionScore?.instructorScore;

      return [
        key,
        instructorScore ?? instructorScore === 0 ? String(instructorScore) : String(legacyScore === '' ? '' : legacyScore),
      ];
    }),
  );

export default function FeedbackReport({
  submissionId,
  evaluationId,
  onEvaluationSaved,
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [evaluation, setEvaluation] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [availableRubrics, setAvailableRubrics] = useState([]);
  const [selectedRubricId, setSelectedRubricId] = useState('');
  const [criterionInputs, setCriterionInputs] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showAI, setShowAI] = useState(true);
  const [showRubric, setShowRubric] = useState(true);
  const [error, setError] = useState('');

  const card = `rounded-3xl border backdrop-blur-md transition-colors duration-300 ${
    isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/80'
  }`;

  useEffect(() => {
    let cancelled = false;

    const loadEvaluation = async () => {
      if (!submissionId && !evaluationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data } = evaluationId
          ? await api.get(`/evaluations/${evaluationId}`)
          : await api.get(`/evaluations/submission/${submissionId}`);

        if (cancelled) return;

        const resolvedRubric =
          data?.rubricId && typeof data.rubricId === 'object'
            ? data.rubricId
            : null;

        setEvaluation(data);
        setRubric(resolvedRubric);
        setSelectedRubricId(resolvedRubric?._id ?? data?.rubricId ?? '');
        setFeedback(data?.writtenFeedback ?? '');
        setCriterionInputs(
          buildStateFromEvaluation(resolvedRubric, data),
        );
      } catch (requestError) {
        if (cancelled) return;

        if (requestError.response?.status === 404 && submissionId) {
          setEvaluation(null);
          setRubric(null);
          setFeedback('');
          setCriterionInputs({});

          try {
            const { data } = await api.get('/rubrics');
            if (cancelled) return;
            setAvailableRubrics(Array.isArray(data) ? data : []);
            setSelectedRubricId(
              Array.isArray(data) && data.length ? data[0]._id : '',
            );
          } catch {
            if (!cancelled) {
              setAvailableRubrics([]);
            }
          }
        } else {
          setError(
            requestError.response?.data?.message ||
              'Unable to load this evaluation.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadEvaluation();

    return () => {
      cancelled = true;
    };
  }, [evaluationId, submissionId]);

  useEffect(() => {
    let cancelled = false;

    const loadAiAnalysis = async () => {
      if (!submissionId) {
        setLoadingAI(false);
        return;
      }

      setLoadingAI(true);

      try {
        const { data } = await api.get(`/ai-analyses/submission/${submissionId}`);
        if (!cancelled) setAiAnalysis(data);
      } catch {
        if (!cancelled) setAiAnalysis(null);
      } finally {
        if (!cancelled) setLoadingAI(false);
      }
    };

    void loadAiAnalysis();

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const criterionState = useMemo(() => {
    if (!rubric?.criteria?.length) return [];

    return rubric.criteria.map((criterion) => {
      const key = normalizeKey(criterion.name);
      const source =
        evaluation?.criterionScores?.find((item) => item.key === key) ??
        evaluation?.criterionScores?.find(
          (item) => normalizeKey(item.name) === key,
        ) ??
        null;

      const instructorRaw = criterionInputs[key] ?? '';
      const parsed =
        instructorRaw === '' ? null : Number.parseFloat(instructorRaw);
      const instructorScore =
        parsed === null || Number.isNaN(parsed) ? null : round(parsed);
      const aiScore =
        source?.aiScore ?? (source?.aiScore === 0 ? 0 : null);
      const finalScore =
        instructorScore ?? aiScore ?? null;
      const invalid =
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

  const totals = useMemo(() => {
    const maxScore = (rubric?.criteria ?? []).reduce(
      (sum, criterion) => sum + criterion.maxScore,
      0,
    );
    const finalScore = criterionState.reduce(
      (sum, item) => sum + (item.finalScore ?? 0),
      0,
    );
    const aiScore = criterionState.reduce(
      (sum, item) => sum + (item.aiScore ?? 0),
      0,
    );
    const instructorScore = criterionState.reduce(
      (sum, item) => sum + (item.instructorScore ?? 0),
      0,
    );

    return {
      maxScore: round(maxScore),
      finalScore: round(finalScore),
      aiScore: round(aiScore),
      instructorScore: round(instructorScore),
      overallPercent: maxScore > 0 ? round((finalScore / maxScore) * 100) : 0,
    };
  }, [criterionState, rubric]);

  const canSave =
    (evaluation || selectedRubricId) &&
    criterionState.every((item) => !item.invalid);

  const hydrateFromEvaluation = (nextEvaluation) => {
    const nextRubric =
      nextEvaluation?.rubricId && typeof nextEvaluation.rubricId === 'object'
        ? nextEvaluation.rubricId
        : rubric;

    setEvaluation(nextEvaluation);
    if (nextRubric) {
      setRubric(nextRubric);
      setSelectedRubricId(nextRubric._id);
      setCriterionInputs(buildStateFromEvaluation(nextRubric, nextEvaluation));
    }
    setFeedback(nextEvaluation?.writtenFeedback ?? '');
    onEvaluationSaved?.(nextEvaluation);
  };

  const buildPayload = () => ({
    submissionId,
    rubricId: selectedRubricId,
    writtenFeedback: feedback,
    aiInsightsUsed: true,
    criterionScores: criterionState.map((item) => ({
      criterionName: item.criterion.name,
      ...(item.instructorScore !== null
        ? {
            instructorScore: item.instructorScore,
            finalScore: item.instructorScore,
          }
        : {}),
      ...(item.overrideApplied
        ? { overrideReason: 'Instructor override applied in evaluation UI' }
        : {}),
    })),
  });

  const saveDraft = async () => {
    if (!canSave) return null;

    const payload = buildPayload();
    const response = evaluation?._id
      ? await api.put(`/evaluations/${evaluation._id}`, payload)
      : await api.post('/evaluations', payload);

    const nextEvaluation = response.data;
    hydrateFromEvaluation(nextEvaluation);
    return nextEvaluation;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await saveDraft();
      setMessage('Evaluation draft saved successfully.');
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          'Failed to save the evaluation draft.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const draft = await saveDraft();
      if (!draft?._id) {
        throw new Error('The draft could not be created.');
      }

      const { data } = await api.put(`/evaluations/${draft._id}/submit`);
      hydrateFromEvaluation(data);
      setMessage('Evaluation submitted. The final score is now authoritative.');
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          submitError.message ||
          'Failed to submit the evaluation.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCriterionChange = (criterion, value) => {
    const key = normalizeKey(criterion.name);
    setCriterionInputs((current) => ({ ...current, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((item) => (
          <div
            key={item}
            className={`h-40 animate-pulse rounded-3xl ${
              isDark ? 'bg-white/5' : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${card} p-6`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
          <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!evaluation && !submissionId) {
    return null;
  }

  return (
    <div className="space-y-6">
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
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Compare AI suggestions with instructor judgment, override where needed,
              and lock the final score once you are satisfied.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save draft
            </button>

            <button
              onClick={handleSubmitEvaluation}
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {evaluation?.status === 'submitted' ? 'Update final evaluation' : 'Submit evaluation'}
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        ) : null}
      </div>

      {!evaluation && !rubric ? (
        <div className={`${card} p-6`}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15">
              <Wand2 className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Start from a rubric
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Pick the rubric you want to apply to this submission. The draft will be prefilled with AI suggestions when available.
              </p>
            </div>
          </div>

          {availableRubrics.length ? (
            <label className="block space-y-2 text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                Available rubrics
              </span>
              <select
                value={selectedRubricId}
                onChange={(event) => setSelectedRubricId(event.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                  isDark
                    ? 'border-white/10 bg-black/20 text-white'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                {availableRubrics.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              No rubric is available yet. Create a rubric first, then come back to score this submission.
            </div>
          )}
        </div>
      ) : null}

      {rubric ? (
        <>
          <div className={`${card} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Active rubric
                </p>
                <h4 className={`mt-1 text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {rubric.name}
                </h4>
                {rubric.description ? (
                  <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {rubric.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                <ScoreRing
                  score={totals.overallPercent}
                  label="Overall %"
                  color="#ef4444"
                  isDark={isDark}
                />
                <ScoreRing
                  score={rubric.criteria.length ? round((totals.aiScore / totals.maxScore) * 100) : 0}
                  label="AI %"
                  color="#3b82f6"
                  isDark={isDark}
                />
                <ScoreRing
                  score={rubric.criteria.length ? round((totals.instructorScore / totals.maxScore) * 100) : 0}
                  label="Instructor %"
                  color="#10b981"
                  isDark={isDark}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['AI total', totals.aiScore, totals.maxScore],
                ['Instructor total', totals.instructorScore, totals.maxScore],
                ['Final total', totals.finalScore, totals.maxScore],
              ].map(([label, value, max]) => (
                <div
                  key={label}
                  className={`rounded-2xl border px-4 py-4 ${
                    isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {label}
                  </p>
                  <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {value} <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/ {max}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={card}>
            <button
              onClick={() => setShowRubric((current) => !current)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <ClipboardList className="h-3.5 w-3.5" />
                Criterion scoring
              </h4>
              {showRubric ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {showRubric ? (
              <div className={`space-y-4 border-t px-6 pb-6 pt-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                {criterionState.map((item) => (
                  <CriterionEditorRow
                    key={item.key}
                    criterion={item.criterion}
                    rowState={item}
                    isDark={isDark}
                    onChange={handleCriterionChange}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className={`${card} p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <MessageSquare className="h-3.5 w-3.5" />
                Written feedback
              </h4>
            </div>

            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={5}
              placeholder="Explain the final decision, note strengths, and point to specific improvements."
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                isDark
                  ? 'border-white/10 bg-black/20 text-white placeholder:text-gray-500'
                  : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
              }`}
            />
          </div>
        </>
      ) : null}

      {!loadingAI && aiAnalysis && !aiAnalysis.message ? (
        <div className={card}>
          <button
            onClick={() => setShowAI((current) => !current)}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <h4 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Brain className="h-3.5 w-3.5" />
              AI evidence used in scoring
            </h4>
            {showAI ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showAI ? (
            <div className={`space-y-5 border-t px-6 pb-6 pt-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="space-y-3">
                <StatRow icon={Mic} label="Speech rate" value={aiAnalysis.speechRate} unit="wpm" isDark={isDark} />
                <StatRow icon={Volume2} label="Pause frequency" value={aiAnalysis.pauseFrequency} unit="pauses" isDark={isDark} />
                <StatRow
                  icon={Award}
                  label="Pronunciation score"
                  value={aiAnalysis.pronunciationScore}
                  unit="/100"
                  isDark={isDark}
                />
              </div>

              {aiAnalysis.suggestions?.length ? (
                <div>
                  <p className={`mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Lightbulb className="h-3.5 w-3.5" />
                    AI suggestions
                  </p>
                  <div className="space-y-2">
                    {aiAnalysis.suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion}-${index}`}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <span className="mt-0.5 text-sm font-bold text-blue-400">{index + 1}.</span>
                        <span className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                          {suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

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
  isDark: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

FeedbackReport.propTypes = {
  submissionId: PropTypes.string,
  evaluationId: PropTypes.string,
  onEvaluationSaved: PropTypes.func,
};
