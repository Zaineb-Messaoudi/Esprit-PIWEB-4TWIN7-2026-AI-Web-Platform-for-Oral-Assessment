import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileAudio,
  FileVideo,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { api } from '../utils/api';

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
  pending:   { label: 'Pending review', icon: Clock3,       cls: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
  graded:    { label: 'Graded',         icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
  cancelled: { label: 'Cancelled',      icon: XCircle,      cls: 'bg-red-500/15 text-red-300 border-red-400/30' },
};

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/* ─── Animated waveform (audio visual) ────────────────────── */
function WaveformBars({ playing }) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${playing ? 'bg-red-400' : 'bg-white/20'}`}
          style={{
            height: `${22 + Math.sin(i * 0.7) * 16 + Math.cos(i * 1.2) * 8}%`,
            animationName: playing ? 'wave' : 'none',
            animationDuration: `${0.35 + (i % 6) * 0.09}s`,
            animationIterationCount: 'infinite',
            animationDirection: i % 2 === 0 ? 'alternate' : 'alternate-reverse',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
}

/* ─── Media player ─────────────────────────────────────────── */
function MediaPlayer({ src, isAudio, isDark }) {
  const mediaRef  = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [muted, setMuted]         = useState(false);
  const [progress, setProgress]   = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [volume, setVolume]       = useState(1);
  const [loaded, setLoaded]       = useState(false);

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
    if (!mediaRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mediaRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (mediaRef.current) { mediaRef.current.volume = v; setMuted(v === 0); }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    const next = !muted;
    mediaRef.current.muted = next;
    setMuted(next);
  };

  if (!src) return (
    <div className={`flex items-center justify-center h-40 rounded-2xl border text-sm ${
      isDark ? 'border-white/10 bg-black/20 text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-400'
    }`}>No media file</div>
  );

  const onTimeUpdate = () => {
    const m = mediaRef.current;
    if (!m) return;
    setCurrentTime(m.currentTime);
    setProgress((m.currentTime / m.duration) * 100 || 0);
  };

  const onLoaded = () => {
    setDuration(mediaRef.current?.duration || 0);
    setLoaded(true);
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      isDark ? 'border-white/10 bg-gradient-to-br from-black/40 to-white/5' : 'border-gray-200 bg-white'
    }`}>
      {/* Video */}
      {!isAudio && (
        <div className="relative bg-black aspect-video">
          <video
            ref={mediaRef} src={src}
            className="w-full h-full object-contain"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoaded}
            onEnded={() => setPlaying(false)}
          />
          {!playing && loaded && (
            <button onClick={toggle} className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-red-500/90 flex items-center justify-center shadow-2xl">
                <Play size={26} className="text-white ml-1" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Audio visualiser */}
      {isAudio && (
        <div className={`flex items-center justify-center py-12 px-6 ${
          isDark ? 'bg-gradient-to-br from-red-900/20 to-black/40' : 'bg-gradient-to-br from-red-50 to-gray-100'
        }`}>
          <audio
            ref={mediaRef} src={src}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoaded}
            onEnded={() => setPlaying(false)}
          />
          <div className="flex flex-col items-center gap-5">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl ${
              isDark ? 'bg-red-500/20 border border-red-400/30' : 'bg-red-50 border border-red-200'
            }`}>
              <FileAudio size={36} className={isDark ? 'text-red-300' : 'text-red-500'} />
            </div>
            <WaveformBars playing={playing} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={`px-5 py-4 space-y-3 ${isDark ? 'bg-black/20' : 'bg-white'}`}>
        {/* Progress */}
        <div
          className="relative h-2 rounded-full cursor-pointer group"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}
          onClick={seek}
        >
          <div className="absolute left-0 top-0 h-full rounded-full bg-red-500" style={{ width: `${progress}%` }} />
          <div
            className="absolute w-3 h-3 rounded-full bg-red-400 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={toggle} disabled={!loaded}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'bg-red-500 hover:bg-red-400 text-white disabled:opacity-40'
                       : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-40'
              }`}>
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button onClick={restart} disabled={!loaded}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              } disabled:opacity-40`}>
              <RotateCcw size={14} />
            </button>
            <span className={`text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {fmtDuration(currentTime) || '0:00'} / {fmtDuration(duration) || '—'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={handleVolume} className="w-20 h-1 accent-red-500 cursor-pointer" />
            <a href={src} download target="_blank" rel="noreferrer"
              className={`ml-1 w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}>
              <Download size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────── */
export default function StudentSubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/submissions/${id}`);
        setSubmission(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load submission.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const cardBase   = isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white/90 border-gray-200 text-gray-900 shadow-sm';
  const subtleText = isDark ? 'text-gray-400' : 'text-gray-500';
  const mutedText  = isDark ? 'text-gray-300' : 'text-gray-600';

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

  const mediaUrl     = submission?.fileUrl || submission?.audioFileUrl || submission?.videoFileUrl;
  const fullMediaUrl = mediaUrl ? `${BASE_URL}${mediaUrl}` : null;
  const isAudio      = submission?.fileType === 'audio' || !!submission?.audioFileUrl;
  const statusMeta   = STATUS_META[submission?.status] || STATUS_META.pending;
  const StatusIcon   = statusMeta.icon;
  const isSubmitted  = !submission?.isDraft;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                   : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
          }`}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h2 className="text-2xl font-bold">My Submission</h2>
          <p className={`text-sm ${subtleText}`}>{submission?.assignmentTitle}</p>
        </div>
      </div>

      {/* ── Status banner ────────────────────────────────────── */}
      <section className={`rounded-3xl border p-5 flex items-center justify-between flex-wrap gap-4 ${cardBase}`}>
        <div className="flex items-center gap-4">
          <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/10' : 'bg-red-50'}`}>
            {isAudio
              ? <FileAudio className={isDark ? 'text-red-200' : 'text-red-600'} size={20} />
              : <FileVideo className={isDark ? 'text-red-200' : 'text-red-600'} size={20} />}
          </div>
          <div>
            <p className="font-semibold">{submission?.title || submission?.assignmentTitle}</p>
            <p className={`text-xs ${subtleText}`}>
              {[fmtSize(submission?.fileSize), fmtDuration(submission?.fileDuration)].filter(Boolean).join(' • ') || 'No metadata'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Draft / Submitted badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${
            isSubmitted
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-400/30'
          }`}>
            {isSubmitted ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
            {isSubmitted ? 'Submitted' : 'Draft'}
          </span>

          {/* Review status */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${statusMeta.cls}`}>
            <StatusIcon size={12} />
            {statusMeta.label}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">

        {/* ── LEFT — Player ────────────────────────────────────── */}
        <section className={`rounded-3xl border p-6 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-5">
            {isAudio ? 'Your audio recording' : 'Your video recording'}
          </h3>
          <MediaPlayer src={fullMediaUrl} isAudio={isAudio} isDark={isDark} />
        </section>

        {/* ── RIGHT — Submission info ───────────────────────────── */}
        <div className="space-y-4">

          {/* Details */}
          <section className={`rounded-3xl border p-6 ${cardBase}`}>
            <h3 className="text-lg font-semibold mb-4">Details</h3>
            <div className="space-y-3">
              {[
                ['Assignment',   submission?.assignmentTitle || '—'],
                ['Type',         (submission?.submissionType || '—').replace('_', ' ')],
                ['File type',    submission?.fileType || '—'],
                ['Submitted at', isSubmitted ? fmtDate(submission?.submittedAt) : '—'],
              ].map(([label, value]) => (
                <div key={label} className={`flex justify-between items-start gap-2 py-2 border-b last:border-0 ${
                  isDark ? 'border-white/5' : 'border-gray-100'
                }`}>
                  <span className={`text-xs ${subtleText}`}>{label}</span>
                  <span className="text-xs font-semibold text-right capitalize">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Class info */}
          {submission?.class && (
            <section className={`rounded-3xl border p-6 ${cardBase}`}>
              <h3 className="text-lg font-semibold mb-3">Class</h3>
              <p className="font-semibold text-sm">{submission.class.name}</p>
              <p className={`text-xs mt-1 ${subtleText}`}>
                {[submission.class.academicYear, submission.class.semester].filter(Boolean).join(' • ') || '—'}
              </p>
            </section>
          )}

          {/* Grade (read-only for student) */}
          <section className={`rounded-3xl border p-6 ${cardBase}`}>
            <div className="flex items-center gap-3 mb-4">
              <CalendarDays size={18} className={subtleText} />
              <h3 className="text-lg font-semibold">Your grade</h3>
            </div>
            {submission?.grade != null ? (
              <div className="text-center">
                <span className={`text-5xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  {submission.grade}
                </span>
                <span className={`text-lg ${mutedText}`}> / 20</span>
                <p className={`text-xs mt-2 ${subtleText}`}>Final grade</p>
              </div>
            ) : (
              <p className={`text-sm text-center py-4 ${subtleText}`}>
                Not graded yet
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}