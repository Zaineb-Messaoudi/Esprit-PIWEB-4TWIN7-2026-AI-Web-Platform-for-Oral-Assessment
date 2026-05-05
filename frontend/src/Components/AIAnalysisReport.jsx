import { memo, useState } from 'react';
import {
  Brain, Mic, Volume2, Clock, Lightbulb, MessageSquare,
  Eye, ChevronDown, ChevronUp, Save, RefreshCw,
  BookOpen, Award, Activity, BarChart2, Waves, Wind,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { updateAiFeedback } from '../api/aiAnalysis';

// ─── CEFR config ──────────────────────────────────────────────────────────────
const CEFR = {
  A1: { label: 'Beginner',           color: '#10b981', tw: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  A2: { label: 'Elementary',         color: '#10b981', tw: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  B1: { label: 'Intermediate',       color: '#3b82f6', tw: 'text-blue-300',    bg: 'bg-blue-500/15 border-blue-500/20' },
  B2: { label: 'Upper-Intermediate', color: '#3b82f6', tw: 'text-blue-300',    bg: 'bg-blue-500/15 border-blue-500/20' },
  C1: { label: 'Advanced',           color: '#8b5cf6', tw: 'text-purple-300',  bg: 'bg-purple-500/15 border-purple-500/20' },
  C2: { label: 'Mastery',            color: '#8b5cf6', tw: 'text-purple-300',  bg: 'bg-purple-500/15 border-purple-500/20' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ScoreRing = memo(({ score, label, color, isDark }) => {
  const r = 36, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} strokeWidth="8" fill="none"
            className={isDark ? 'stroke-white/10' : 'stroke-gray-200'} />
          <circle cx="48" cy="48" r={r} strokeWidth="8" fill="none"
            stroke={color} strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
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

const StatRow = memo(({ icon: Icon, label, value, unit, isDark, color = 'text-red-400' }) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
    </div>
    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {value ?? '—'}{unit && <span className="ml-1 text-xs font-normal opacity-60">{unit}</span>}
    </span>
  </div>
));
StatRow.displayName = 'StatRow';

const SectionHeader = memo(({ icon: Icon, title, isDark }) => (
  <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
    isDark ? 'text-gray-500' : 'text-gray-400'
  }`}>
    <Icon className="w-3.5 h-3.5" />{title}
  </p>
));

const Collapsible = ({ title, icon: Icon, defaultOpen = false, isDark, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
      <button onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left">
        <SectionHeader icon={Icon} title={title} isDark={isDark} />
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" />
               : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className={`px-5 pb-5 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
};

// ─── Editable feedback block ──────────────────────────────────────────────────
const EditableFeedback = ({ analysisId, field, initialValue, isDark }) => {
  const [value, setValue]   = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateAiFeedback(analysisId, { [field]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        rows={8}
        value={value}
        onChange={e => setValue(e.target.value)}
        className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition leading-relaxed ${
          isDark
            ? 'border-white/10 bg-black/20 text-white placeholder:text-gray-500'
            : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
        }`}
      />
      <button
        onClick={save}
        disabled={saving}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          saved
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
        } disabled:opacity-50`}
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save changes'}
      </button>
    </div>
  );
};

// ─── Chart grid ───────────────────────────────────────────────────────────────
const ChartGrid = memo(({ charts, isDark }) => {
  const items = [
    { key: 'wpm',        label: 'Words Per Minute' },
    { key: 'volume',     label: 'Volume Over Time' },
    { key: 'fillers',    label: 'Filler Words' },
    { key: 'expression', label: 'Expression Timeline' },
  ].filter(({ key }) => charts?.[key]);

  if (!items.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ key, label }) => (
        <div key={key} className={`rounded-2xl border overflow-hidden ${
          isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'
        }`}>
          <p className={`px-3 pt-3 text-[10px] font-bold uppercase tracking-widest ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>{label}</p>
          <img
            src={`data:image/png;base64,${charts[key]}`}
            alt={label}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
});
ChartGrid.displayName = 'ChartGrid';

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {object}  analysis  - AIAnalysis document from backend
 * @param {boolean} editable  - instructor can edit aiFeedback / visualFeedback
 * @param {boolean} compact   - stripped-down view (inside FeedbackReport sidebar)
 */
export default function AIAnalysisReport({ analysis, editable = false, compact = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!analysis) return null;

  const card = `rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  const vm  = analysis.voiceMetrics   ?? {};
  const ed  = analysis.emotionDetection ?? null;
  const bl  = analysis.bodyLanguage    ?? null;
  const cefrLevel = analysis.cefrLevel;
  const cefrCfg   = CEFR[cefrLevel] ?? null;
  const hasVisual = !!(ed || bl);

  // Scores derived from what the backend stores
  const overallScore = analysis.overallScore ?? analysis.confidenceScore;

  // ── Compact mode (inside FeedbackReport) ────────────────────────────────
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="grid gap-2">
          <StatRow icon={Mic}      label="Speech rate"       value={analysis.speechRate}          unit="wpm"    isDark={isDark} />
          <StatRow icon={Clock}    label="Pause frequency"   value={analysis.pauseFrequency}      unit="pauses" isDark={isDark} />
          <StatRow icon={Award}    label="Pronunciation"     value={analysis.pronunciationScore}  unit="/100"   isDark={isDark} />
          <StatRow icon={Activity} label="Overall AI score"  value={overallScore}                 unit="/100"   isDark={isDark} color="text-blue-400" />
        </div>

        {cefrCfg && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${cefrCfg.bg} ${cefrCfg.tw}`}>
            <BookOpen className="w-3 h-3" />
            {cefrLevel} · {cefrCfg.label}
          </div>
        )}

        {analysis.fillerWords?.length > 0 && (
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Filler words
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.fillerWords.map((fw, i) => (
                <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                         : 'bg-orange-50 border-orange-200 text-orange-600'
                }`}>"{fw.word}" ×{fw.count}</span>
              ))}
            </div>
          </div>
        )}

        {/* Editable AI feedback in compact mode */}
        {analysis.aiFeedback && (
          <Collapsible title="AI Feedback" icon={Brain} isDark={isDark}>
            {editable ? (
              <EditableFeedback
                analysisId={analysis._id}
                field="aiFeedback"
                initialValue={analysis.aiFeedback}
                isDark={isDark}
              />
            ) : (
              <p className={`text-sm leading-relaxed whitespace-pre-line ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>{analysis.aiFeedback}</p>
            )}
          </Collapsible>
        )}

        {analysis.suggestions?.length > 0 && (
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Lightbulb className="w-3 h-3" /> Suggestions
            </p>
            <div className="space-y-1.5">
              {analysis.suggestions.map((s, i) => (
                <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${
                  isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                         : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <span className="font-bold">{i + 1}.</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Full mode (StudentReport, StudentSubmissionDetail) ───────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={`${card} p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 mb-3">
              <Brain className="w-3.5 h-3.5" />
              AI Speech Analysis
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {cefrCfg && (
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${cefrCfg.bg} ${cefrCfg.tw}`}>
                  <BookOpen className="w-3.5 h-3.5" />
                  {cefrLevel} · {cefrCfg.label}
                </span>
              )}
              {analysis.durationSeconds && (
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {Math.floor(analysis.durationSeconds / 60)}m {Math.floor(analysis.durationSeconds % 60)}s
                  · {analysis.wordCount} words
                </span>
              )}
            </div>
          </div>

          {/* Overall score ring */}
          {overallScore != null && (
            <ScoreRing score={overallScore} label="Overall" color="#ef4444" isDark={isDark} />
          )}
        </div>

        {/* Score rings row */}
        {(analysis.pronunciationScore != null || analysis.confidenceScore != null) && (
          <div className={`mt-5 pt-5 border-t flex flex-wrap justify-around gap-4 ${
            isDark ? 'border-white/10' : 'border-gray-100'
          }`}>
            <ScoreRing score={analysis.pronunciationScore} label="Pronunciation" color="#3b82f6" isDark={isDark} />
            <ScoreRing score={analysis.confidenceScore}    label="Confidence"    color="#10b981" isDark={isDark} />
            {vm.stability?.wpm_std != null && (
              <ScoreRing
                score={Math.round(Math.max(0, 100 - vm.stability.wpm_std * 3))}
                label="Pace Consistency"
                color="#f59e0b"
                isDark={isDark}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Charts ─────────────────────────────────────────────── */}
      {analysis.charts && Object.values(analysis.charts).some(Boolean) && (
        <div className={`${card} p-6`}>
          <SectionHeader icon={BarChart2} title="Performance Charts" isDark={isDark} />
          <div className="mt-4">
            <ChartGrid charts={analysis.charts} isDark={isDark} />
          </div>
        </div>
      )}

      {/* ── Speech metrics ─────────────────────────────────────── */}
      <div className={`${card} p-6`}>
        <SectionHeader icon={Mic} title="Speech Metrics" isDark={isDark} />
        <div className="mt-4 space-y-2">
          <StatRow icon={Mic}      label="Speech rate"         value={analysis.speechRate}            unit="wpm"    isDark={isDark} />
          <StatRow icon={Clock}    label="Pause frequency"     value={analysis.pauseFrequency}        unit="pauses" isDark={isDark} />
          {analysis.pauseDuration?.average != null && (
            <StatRow icon={Clock}  label="Avg pause duration"  value={analysis.pauseDuration.average?.toFixed(1)} unit="s" isDark={isDark} />
          )}
          {analysis.pauseDuration?.maximum != null && (
            <StatRow icon={Clock}  label="Longest pause"       value={analysis.pauseDuration.maximum?.toFixed(1)} unit="s" isDark={isDark} />
          )}
        </div>

        {/* Voice quality */}
        {vm.pitch?.mean > 0 && (
          <>
            <div className={`mt-4 mb-3 border-t pt-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <SectionHeader icon={Waves} title="Voice Quality" isDark={isDark} />
            </div>
            <div className="space-y-2">
              <StatRow icon={Activity} label="Pitch mean"     value={vm.pitch.mean?.toFixed(0)}  unit="Hz"  isDark={isDark} color="text-purple-400" />
              <StatRow icon={Activity} label="Pitch range"    value={vm.pitch.range?.toFixed(0)} unit="Hz"  isDark={isDark} color="text-purple-400" />
              <StatRow icon={Volume2}  label="Volume (avg)"   value={vm.energy.mean?.toFixed(3)}            isDark={isDark} color="text-blue-400"   />
            </div>
          </>
        )}

        {/* Filler words */}
        {analysis.fillerWords?.length > 0 && (
          <>
            <div className={`mt-4 mb-3 border-t pt-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <SectionHeader icon={Wind} title="Filler Words to Avoid" isDark={isDark} />
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.fillerWords.map((fw, i) => (
                <span key={i} className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                  isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                         : 'bg-orange-50 border-orange-200 text-orange-600'
                }`}>"{fw.word}" ×{fw.count}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Visual analysis ─────────────────────────────────────── */}
      {hasVisual && (
        <div className={`${card} p-6`}>
          <SectionHeader icon={Eye} title="Visual & Body Language" isDark={isDark} />
          <div className="mt-4 space-y-2">
            {ed?.eye_contact_pct != null && (
              <StatRow icon={Eye}      label="Eye contact"       value={`${Math.round(ed.eye_contact_pct * 100)}%`}     isDark={isDark} color="text-emerald-400" />
            )}
            {bl?.posture_upright_pct != null && (
              <StatRow icon={Activity} label="Upright posture"   value={`${Math.round(bl.posture_upright_pct * 100)}%`} isDark={isDark} color="text-emerald-400" />
            )}
            {ed?.unique_expressions != null && (
              <StatRow icon={Brain}    label="Expression variety" value={ed.unique_expressions}                           isDark={isDark} color="text-blue-400" />
            )}
          </div>
        </div>
      )}

      {/* ── AI Feedback ─────────────────────────────────────────── */}
      {analysis.aiFeedback && (
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={Brain} title="AI Speech Coach Feedback" isDark={isDark} />
            {editable && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-600'
              }`}>Editable</span>
            )}
          </div>
          {editable ? (
            <EditableFeedback
              analysisId={analysis._id}
              field="aiFeedback"
              initialValue={analysis.aiFeedback}
              isDark={isDark}
            />
          ) : (
            <div className={`px-4 py-3 rounded-xl border text-sm leading-relaxed whitespace-pre-line ${
              isDark ? 'bg-white/5 border-white/10 text-gray-200'
                     : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              {analysis.aiFeedback}
            </div>
          )}
        </div>
      )}

      {/* ── Visual Feedback ─────────────────────────────────────── */}
      {analysis.visualFeedback && (
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={Eye} title="Visual Presence Feedback" isDark={isDark} />
            {editable && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-600'
              }`}>Editable</span>
            )}
          </div>
          {editable ? (
            <EditableFeedback
              analysisId={analysis._id}
              field="visualFeedback"
              initialValue={analysis.visualFeedback}
              isDark={isDark}
            />
          ) : (
            <div className={`px-4 py-3 rounded-xl border text-sm leading-relaxed whitespace-pre-line ${
              isDark ? 'bg-white/5 border-white/10 text-gray-200'
                     : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              {analysis.visualFeedback}
            </div>
          )}
        </div>
      )}

      {/* ── Suggestions ─────────────────────────────────────────── */}
      {analysis.suggestions?.length > 0 && (
        <div className={`${card} p-6`}>
          <SectionHeader icon={Lightbulb} title="Key Suggestions" isDark={isDark} />
          <div className="mt-4 space-y-2">
            {analysis.suggestions.map((s, i) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                       : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <span className="font-bold text-blue-400 flex-shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transcript ──────────────────────────────────────────── */}
      {analysis.transcript && (
        <Collapsible title="Transcript" icon={MessageSquare} isDark={isDark}>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {analysis.transcript}
          </p>
        </Collapsible>
      )}

    </div>
  );
}