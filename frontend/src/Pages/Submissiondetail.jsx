import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileAudio,
  FileVideo,
  GraduationCap,
  Loader2,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Save,
  User,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { api } from '../utils/api'

/* ─── helpers ─────────────────────────────────────────────── */
const fmtDate = (v) => {
  if (!v) return 'N/A';
  const d = new Date(v);
  return isNaN(d) ? v : new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(d);
};

const fmtDuration = (s) => {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const fmtSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const STATUS_META = {
  pending:   { label: 'Pending',   icon: Clock3,       cls: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
  graded:    { label: 'Graded',    icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
  cancelled: { label: 'Cancelled', icon: XCircle,      cls: 'bg-red-500/15 text-red-300 border-red-400/30' },
};

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/* ─── Audio waveform visualiser (CSS-only bars) ────────────── */
function WaveformBars({ playing }) {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {Array.from({ length: 28 }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${playing ? 'bg-red-400' : 'bg-white/20'}`}
          style={{
            height: `${20 + Math.sin(i * 0.8) * 14 + Math.cos(i * 1.3) * 8}%`,
            animationName: playing ? 'wave' : 'none',
            animationDuration: `${0.4 + (i % 5) * 0.1}s`,
            animationIterationCount: 'infinite',
            animationDirection: i % 2 === 0 ? 'alternate' : 'alternate-reverse',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

/* ─── Custom media player ──────────────────────────────────── */
function MediaPlayer({ src, isAudio, isDark }) {
  const mediaRef = useRef(null);
  const [playing, setPlaying]       = useState(false);
  const [muted, setMuted]           = useState(false);
  const [progress, setProgress]     = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(1);
  const [loaded, setLoaded]         = useState(false);

  const toggle = () => {
    const m = mediaRef.current;
    if (!m) return;
    playing ? m.pause() : m.play();
    setPlaying(!playing);
  };

  const restart = () => {
    const m = mediaRef.current;
    if (!m) return;
    m.currentTime = 0;
    m.play();
    setPlaying(true);
  };

  const seek = (e) => {
    const m = mediaRef.current;
    if (!m || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    m.currentTime = ratio * duration;
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (mediaRef.current) {
      mediaRef.current.volume = v;
      setMuted(v === 0);
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    const next = !muted;
    mediaRef.current.muted = next;
    setMuted(next);
  };

  if (!src) return (
    <div className={`flex items-center justify-center h-48 rounded-2xl border ${
      isDark ? 'border-white/10 bg-black/20 text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-400'
    }`}>
      No media file attached
    </div>
  );

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isDark ? 'border-white/10 bg-gradient-to-br from-black/40 to-white/5' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'
    }`}>
      {/* Video element */}
      {!isAudio && (
        <div className="relative bg-black aspect-video">
          <video
            ref={mediaRef}
            src={src}
            className="w-full h-full object-contain"
            onTimeUpdate={() => {
              const m = mediaRef.current;
              if (!m) return;
              setCurrentTime(m.currentTime);
              setProgress((m.currentTime / m.duration) * 100 || 0);
            }}
            onLoadedMetadata={() => {
              setDuration(mediaRef.current?.duration || 0);
              setLoaded(true);
            }}
            onEnded={() => setPlaying(false)}
          />
          {!playing && loaded && (
            <button
              onClick={toggle}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/90 flex items-center justify-center shadow-2xl">
                <Play size={28} className="text-white ml-1" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Audio visualiser */}
      {isAudio && (
        <div className={`flex items-center justify-center py-10 px-6 ${
          isDark ? 'bg-gradient-to-br from-red-900/20 to-black/40' : 'bg-gradient-to-br from-red-50 to-gray-100'
        }`}>
          <audio
            ref={mediaRef}
            src={src}
            onTimeUpdate={() => {
              const m = mediaRef.current;
              if (!m) return;
              setCurrentTime(m.currentTime);
              setProgress((m.currentTime / m.duration) * 100 || 0);
            }}
            onLoadedMetadata={() => {
              setDuration(mediaRef.current?.duration || 0);
              setLoaded(true);
            }}
            onEnded={() => setPlaying(false)}
          />
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Icon */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl ${
              isDark ? 'bg-red-500/20 border border-red-400/30' : 'bg-red-50 border border-red-200'
            }`}>
              <FileAudio size={36} className={isDark ? 'text-red-300' : 'text-red-500'} />
            </div>
            <WaveformBars playing={playing} />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className={`px-5 py-4 space-y-3 ${isDark ? 'bg-black/20' : 'bg-white'}`}>
        {/* Progress bar */}
        <div
          className="relative h-2 rounded-full cursor-pointer group"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}
          onClick={seek}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-400 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>

        {/* Time + buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={toggle}
              disabled={!loaded}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isDark
                  ? 'bg-red-500 hover:bg-red-400 text-white disabled:opacity-40'
                  : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-40'
              }`}
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            {/* Restart */}
            <button
              onClick={restart}
              disabled={!loaded}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'hover:bg-white/10 text-gray-400 disabled:opacity-40' : 'hover:bg-gray-100 text-gray-500 disabled:opacity-40'
              }`}
            >
              <RotateCcw size={15} />
            </button>

            {/* Time */}
            <span className={`text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {fmtDuration(currentTime) || '0:00'} / {fmtDuration(duration) || '—'}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="w-20 h-1 accent-red-500 cursor-pointer"
            />

            {/* Download */}
            <a
              href={src} download target="_blank" rel="noreferrer"
              className={`ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <Download size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────── */
export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [grade, setGrade]           = useState('');
  const [status, setStatus]         = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/submissions/${id}`);
        setSubmission(data);
        setGrade(data.grade ?? '');
        setStatus(data.status ?? 'pending');
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load submission.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { status };
      if (grade !== '') payload.grade = Number(grade);
      const { data } = await api.patch(`/submissions/${id}`, payload);
      setSubmission(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  /* styles */
  const cardBase = isDark
    ? 'bg-white/10 border-white/10 text-white'
    : 'bg-white/90 border-gray-200 text-gray-900 shadow-sm';
  const mutedText  = isDark ? 'text-gray-300' : 'text-gray-600';
  const subtleText = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBase  = isDark
    ? 'bg-black/20 border-white/10 text-white placeholder:text-gray-400'
    : 'bg-white border-gray-200 text-gray-900';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-red-400" size={36} />
    </div>
  );

  if (error) return (
    <div className={`rounded-3xl border p-8 text-center ${cardBase}`}>
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={() => navigate(-1)} className="text-sm underline opacity-70">Go back</button>
    </div>
  );

  const mediaUrl = submission?.fileUrl || submission?.audioFileUrl || submission?.videoFileUrl;
  const fullMediaUrl = mediaUrl ? `${BASE_URL}${mediaUrl}` : null;
  const isAudio = submission?.fileType === 'audio' || !!submission?.audioFileUrl;
  const statusMeta = STATUS_META[status] || STATUS_META.pending;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="space-y-6">

      {/* ── Back + title ─────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            isDark
              ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
              : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
          }`}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h2 className="text-2xl font-bold">Submission Review</h2>
          <p className={`text-sm ${subtleText}`}>
            {submission?.assignmentTitle || 'Assignment'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        {/* ── LEFT — media + submission info ──────────────────── */}
        <div className="space-y-6">

          {/* Player */}
          <section className={`rounded-3xl border p-6 ${cardBase}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10' : 'bg-red-50'}`}>
                {isAudio
                  ? <FileAudio className={isDark ? 'text-red-200' : 'text-red-600'} size={20} />
                  : <FileVideo className={isDark ? 'text-red-200' : 'text-red-600'} size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isAudio ? 'Audio' : 'Video'} submission
                </h3>
                <p className={`text-xs ${subtleText}`}>
                  {[
                    fmtSize(submission?.fileSize),
                    fmtDuration(submission?.fileDuration),
                  ].filter(Boolean).join(' • ') || 'No metadata'}
                </p>
              </div>
            </div>
            <MediaPlayer src={fullMediaUrl} isAudio={isAudio} isDark={isDark} />
          </section>

          {/* Submission details */}
          <section className={`rounded-3xl border p-6 ${cardBase}`}>
            <h3 className="text-lg font-semibold mb-4">Submission details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Assignment',    submission?.assignmentTitle || '—'],
                ['Title',         submission?.title || '—'],
                ['Type',          (submission?.submissionType || '—').replace('_', ' ')],
                ['File type',     submission?.fileType || '—'],
                ['Submitted at',  fmtDate(submission?.submittedAt)],
                ['Recorded by',   submission?.recordedBy
                    ? [submission.recordedBy.firstName, submission.recordedBy.lastName].filter(Boolean).join(' ') || submission.recordedBy.username
                    : 'Student upload'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50'}`}
                >
                  <p className={`text-xs mb-1 ${subtleText}`}>{label}</p>
                  <p className="text-sm font-semibold capitalize">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── RIGHT — student + grade/status ──────────────────── */}
        <div className="space-y-6">

          {/* Student info */}
          <section className={`rounded-3xl border p-6 ${cardBase}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10' : 'bg-red-50'}`}>
                <User className={isDark ? 'text-red-200' : 'text-red-600'} size={20} />
              </div>
              <h3 className="text-lg font-semibold">Student</h3>
            </div>

            <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-600'
                }`}>
                  {[submission?.student?.firstName?.[0], submission?.student?.lastName?.[0]]
                    .filter(Boolean).join('') || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {[submission?.student?.firstName, submission?.student?.lastName]
                      .filter(Boolean).join(' ') || submission?.student?.username || 'Unknown'}
                  </p>
                  <p className={`text-xs ${subtleText}`}>
                    @{submission?.student?.username || '—'}
                  </p>
                </div>
              </div>
              {submission?.student?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className={subtleText} />
                  <span className={`text-xs ${mutedText}`}>{submission.student.email}</span>
                </div>
              )}
            </div>

            {/* Class info */}
            {submission?.class && (
              <div className={`mt-3 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`text-xs mb-1 ${subtleText}`}>Class</p>
                <p className="text-sm font-semibold">{submission.class.name}</p>
                <p className={`text-xs ${subtleText}`}>
                  {[submission.class.academicYear, submission.class.semester].filter(Boolean).join(' • ') || '—'}
                </p>
              </div>
            )}
          </section>

          {/* Grade & Status */}
          <section className={`rounded-3xl border p-6 ${cardBase}`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10' : 'bg-red-50'}`}>
                <GraduationCap className={isDark ? 'text-red-200' : 'text-red-600'} size={20} />
              </div>
              <h3 className="text-lg font-semibold">Grade & Status</h3>
            </div>

            <div className="space-y-4">
              {/* Current status badge */}
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border ${statusMeta.cls}`}>
                <StatusIcon size={13} />
                {statusMeta.label}
              </div>

              {/* Status select */}
              <label className="block space-y-2 text-sm">
                <span className={subtleText}>Change status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}
                >
                  <option value="pending">Pending</option>
                  <option value="graded">Graded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              {/* Grade input */}
              <label className="block space-y-2 text-sm">
                <span className={subtleText}>Grade (0 – 20)</span>
                <input
                  type="number"
                  min="0" max="20" step="0.5"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Enter grade…"
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${inputBase}`}
                />
              </label>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                  saved
                    ? isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                    : isDark ? 'bg-red-500 hover:bg-red-400 text-white disabled:opacity-50'
                             : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                }`}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : saved ? (
                  <><CheckCircle2 size={18} /> Saved!</>
                ) : (
                  <><Save size={18} /> Save changes</>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}