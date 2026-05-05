import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Video, Square, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const MediaRecorderComponent = ({ allowedFileTypes, onRecordingComplete, onCancel }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [status, setStatus] = useState('idle'); // idle | requesting | recording | paused | preview
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef        = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const videoPreviewRef  = useRef(null);
  // FIX 1: removed unused videoPlaybackRef
  // FIX 2: removed unused isVideo / isAudio — mode state already handles this

  const [mode, setMode] = useState(allowedFileTypes === 'both' ? 'audio' : allowedFileTypes);

  // FIX 3: stopStream declared BEFORE the useEffect that uses it
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // FIX 4: recordedUrl added to dependency array (safe — cleanup only runs on unmount,
  //         but the dep satisfies exhaustive-deps without changing behaviour)
  useEffect(() => {
    return () => {
      stopStream();
      clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [stopStream, recordedUrl]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setError(null);
    setStatus('requesting');
    try {
      const constraints = mode === 'video'
        ? { video: true, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === 'video') {
        // ref is always mounted (never conditionally rendered) so this is safe
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.onloadedmetadata = () => {
          videoPreviewRef.current?.play().catch(() => {});
        };
      }

      const mimeType = mode === 'video' ? 'video/webm' : 'audio/webm';
      const recorder = new window.MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setStatus('preview');
        stopStream();
      };

      recorder.start(100);
      setStatus('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

    } catch { // FIX 5: removed unused 'err' variable
      setError(
        `Impossible d'accéder au ${mode === 'video' ? 'caméra/micro' : 'micro'}. Vérifiez les permissions.`
      );
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      setStatus('recording');
    }
  };

  const resetRecording = useCallback(() => {
    stopStream();
    clearInterval(timerRef.current);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setStatus('idle');
    setError(null);
  }, [stopStream, recordedUrl]);

  const confirmRecording = () => {
    if (!recordedBlob) return;
    // Browsers record as webm — use correct extension so backend sees the real type
    const ext      = mode === 'video' ? 'webm' : 'webm';
    const mimeType = mode === 'video' ? 'video/webm' : 'audio/webm';
    const fileName = `recording-${Date.now()}.${ext}`;
    const file     = new File([recordedBlob], fileName, { type: mimeType });
    onRecordingComplete(file, mode);
  };

  return (
    <div className={`rounded-xl border p-6 space-y-4 ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
    }`}>

      {/* Mode selector (both) */}
      {allowedFileTypes === 'both' && status === 'idle' && (
        <div className="flex gap-3 mb-2">
          <button
            onClick={() => setMode('audio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              mode === 'audio'
                ? 'bg-blue-500 text-white'
                : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Mic size={16} /> Audio
          </button>
          <button
            onClick={() => setMode('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              mode === 'video'
                ? 'bg-purple-500 text-white'
                : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Video size={16} /> Vidéo
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-2">
        {mode === 'video'
          ? <Video size={20} className="text-purple-500" />
          : <Mic   size={20} className="text-blue-500"   />
        }
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {mode === 'video' ? 'Enregistrement vidéo' : 'Enregistrement audio'}
        </h3>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Live video preview — always mounted when mode=video so ref is ready,
           hidden via CSS when not actively recording/paused */}
      <video
        ref={videoPreviewRef}
        autoPlay
        playsInline
        muted
        className={`w-full rounded-lg bg-black aspect-video object-cover ${
          mode === 'video' && (status === 'recording' || status === 'paused')
            ? 'block'
            : 'hidden'
        }`}
      />

      {/* Playback preview */}
      {status === 'preview' && recordedUrl && (
        <div className="space-y-2">
          {mode === 'video' ? (
            <video src={recordedUrl} controls className="w-full rounded-lg bg-black aspect-video" />
          ) : (
            <audio src={recordedUrl} controls className="w-full" />
          )}
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Durée : {formatTime(duration)}
          </p>
        </div>
      )}

      {/* Timer */}
      {(status === 'recording' || status === 'paused') && (
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
          }`} />
          <span className={`text-2xl font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatTime(duration)}
          </span>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {status === 'recording' ? 'En cours...' : 'En pause'}
          </span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">

        {status === 'idle' && (
          <button
            onClick={startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all ${
              mode === 'video' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {mode === 'video' ? <Video size={16} /> : <Mic size={16} />}
            Démarrer l'enregistrement
          </button>
        )}

        {status === 'recording' && (
          <button onClick={pauseRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium text-sm transition-all">
            <Pause size={16} /> Pause
          </button>
        )}

        {status === 'paused' && (
          <button onClick={resumeRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-all">
            <Play size={16} /> Reprendre
          </button>
        )}

        {(status === 'recording' || status === 'paused') && (
          <button onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all">
            <Square size={16} /> Arrêter
          </button>
        )}

        {status === 'preview' && (
          <>
            <button onClick={confirmRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-all">
              <Check size={16} /> Utiliser cet enregistrement
            </button>
            <button onClick={resetRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium text-sm transition-all">
              <RotateCcw size={16} /> Recommencer
            </button>
          </>
        )}

        {status !== 'recording' && status !== 'paused' && (
          <button
            onClick={() => { resetRecording(); onCancel(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Annuler
          </button>
        )}
      </div>

      {status === 'requesting' && (
        <p className={`text-sm animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Demande d'accès au {mode === 'video' ? 'caméra et micro' : 'micro'}...
        </p>
      )}
    </div>
  );
};

export default MediaRecorderComponent;