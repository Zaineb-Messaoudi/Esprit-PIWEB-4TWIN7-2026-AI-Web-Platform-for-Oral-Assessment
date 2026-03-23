import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera, Upload, X, RefreshCw,
  CheckCircle, AlertCircle, Loader, ScanFace,
} from 'lucide-react';
import { useFaceCapture } from '../hooks/useFaceCapture.jsx';
import { useTheme } from '../context/ThemeContect.jsx';

export default function FaceCapture({
  onCapture,
  onClear,
  error: externalError,
  disabled = false,
}) {
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  const [mode, setMode]         = useState('idle'); // 'idle' | 'webcam' | 'done'
  const [preview, setPreview]   = useState(null);
  const [feedback, setFeedback] = useState(null);   // { type, text }
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [hovering, setHovering] = useState(false);

  const videoRef     = useRef(null);
  const streamRef    = useRef(null);
  const fileInputRef = useRef(null);

  const { validateImage, captureFrame, validating } = useFaceCapture();

  // ── Webcam helpers ────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
  }, []);

  const startWebcam = useCallback(async () => {
    setCamError(null);
    setCamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      setMode('webcam');
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCamReady(true);
        }
      });
    } catch {
      setCamError('Camera access denied.');
    }
  }, []);

  // ── Capture frame ─────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !camReady) return;
    setFeedback(null);
    const { valid, error, base64 } = await captureFrame(videoRef.current);
    stopStream();
    if (!valid || !base64) {
      setPreview(null);
      setMode('idle');
      setFeedback({ type: 'error', text: error });
      onClear?.();
      return;
    }
    setPreview(base64);
    setMode('done');
    setFeedback({ type: 'success', text: 'Face verified!' });
    onCapture?.(base64);
  }, [camReady, captureFrame, stopStream, onCapture, onClear]);

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setFeedback(null);
    const { valid, error, base64 } = await validateImage(file);
    if (!valid || !base64) {
      setFeedback({ type: 'error', text: error });
      onClear?.();
      return;
    }
    setPreview(base64);
    setMode('done');
    setFeedback({ type: 'success', text: 'Face verified!' });
    onCapture?.(base64);
  }, [validateImage, onCapture, onClear]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    stopStream();
    setMode('idle');
    setPreview(null);
    setFeedback(null);
    onClear?.();
  }, [stopStream, onClear]);

  useEffect(() => () => stopStream(), [stopStream]);

  const hasError = !!externalError || feedback?.type === 'error';

  // ── WEBCAM modal overlay ──────────────────────────────────────────────────
  if (mode === 'webcam') {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Label */}
        <p className={`text-xs font-medium tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Profile Photo
        </p>

        {/* Circular webcam view */}
        <div className="relative">
          {/* Outer ring */}
          <div className={`w-36 h-36 rounded-full p-[3px] ${
            isDark
              ? 'bg-gradient-to-br from-red-500/60 via-red-600/40 to-gray-700/60'
              : 'bg-gradient-to-br from-red-400/70 via-red-500/50 to-gray-300/60'
          }`}>
            <div className={`w-full h-full rounded-full overflow-hidden relative ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Oval guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-28 rounded-full border-2 border-dashed border-white/50" />
              </div>
              {!camReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Animated scanning ring */}
          {camReady && (
            <div className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping pointer-events-none" />
          )}
        </div>

        <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Center your face in the circle
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClear}
            className={`p-2.5 rounded-full border transition-all ${
              isDark
                ? 'border-gray-600 hover:bg-gray-700 text-gray-400'
                : 'border-gray-300 hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!camReady || validating}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-red-500/25"
          >
            {validating
              ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Checking…</>
              : <><Camera className="w-3.5 h-3.5" /> Capture</>
            }
          </button>
        </div>

        {camError && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{camError}</p>
          </div>
        )}
      </div>
    );
  }

  // ── IDLE & DONE: circular avatar ──────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Label */}
      <p className={`text-xs font-medium tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        Profile Photo <span className="text-red-400">*</span>
      </p>

      {/* Circle */}
      <div
        className="relative group"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Gradient ring — red on error, green on success, subtle default */}
        <div className={`w-32 h-32 rounded-full p-[3px] transition-all duration-300 ${
          hasError
            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30'
            : feedback?.type === 'success'
            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/20'
            : hovering
            ? isDark
              ? 'bg-gradient-to-br from-red-500/70 to-red-700/50'
              : 'bg-gradient-to-br from-red-400/60 to-red-600/40'
            : isDark
            ? 'bg-gradient-to-br from-gray-600/60 to-gray-700/40'
            : 'bg-gradient-to-br from-gray-300/80 to-gray-400/40'
        }`}>
          <div className={`w-full h-full rounded-full overflow-hidden relative transition-all duration-300 ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>

            {/* Preview image */}
            {mode === 'done' && preview && (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            )}

            {/* Idle placeholder */}
            {mode === 'idle' && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <Camera className={`w-5 h-5 transition-colors duration-300 ${
                    hovering ? 'text-red-400' : isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
              </div>
            )}

            {/* Validating overlay */}
            {validating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader className="w-6 h-6 text-white animate-spin" />
              </div>
            )}

            {/* Hover overlay with actions */}
            {!validating && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300 rounded-full ${
                hovering ? 'opacity-100 bg-black/50' : 'opacity-0'
              }`}>
                {mode === 'done' ? (
                  // Retake button on hover over done state
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={disabled}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Retake</span>
                  </button>
                ) : (
                  // Upload / camera choices on hover
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={startWebcam}
                      disabled={disabled}
                      className="flex flex-col items-center gap-1 text-white hover:text-red-300 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-[10px]">Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                      className="flex flex-col items-center gap-1 text-white hover:text-red-300 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px]">Upload</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        {!validating && feedback?.type === 'success' && (
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-md">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
        {hasError && !validating && (
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-red-500 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-md">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Action buttons below avatar (always visible, not just on hover) */}
      {mode === 'idle' && !hovering && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startWebcam}
            disabled={disabled || validating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              isDark
                ? 'border-gray-600/60 hover:border-red-400/50 hover:bg-gray-700/60 text-gray-400 hover:text-gray-200'
                : 'border-gray-300 hover:border-red-400/50 hover:bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
          >
            <Camera className="w-3 h-3" /> Camera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || validating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              isDark
                ? 'border-gray-600/60 hover:border-red-400/50 hover:bg-gray-700/60 text-gray-400 hover:text-gray-200'
                : 'border-gray-300 hover:border-red-400/50 hover:bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-3 h-3" /> Upload
          </button>
        </div>
      )}

      {mode === 'done' && !hovering && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
            isDark
              ? 'border-gray-600/60 hover:border-red-400/50 hover:bg-gray-700/60 text-gray-400'
              : 'border-gray-300 hover:border-red-400/50 hover:bg-gray-50 text-gray-500'
          }`}
        >
          <RefreshCw className="w-3 h-3" /> Change Photo
        </button>
      )}

      {/* Error / success text */}
      {(externalError || (feedback && !validating)) && (
        <div className="flex items-center gap-1.5">
          {(externalError || feedback?.type === 'error') ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{externalError || feedback?.text}</p>
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <p className="text-xs text-green-500">{feedback?.text}</p>
            </>
          )}
        </div>
      )}

      {camError && (
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{camError}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
}