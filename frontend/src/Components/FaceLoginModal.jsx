import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Camera, Loader, AlertCircle, ScanFace, RefreshCw } from 'lucide-react';
import { useFaceCapture } from '../hooks/useFaceCapture.jsx';
import { useTheme } from '../context/ThemeContect.jsx';

export default function FaceLoginModal({ onSuccess, onClose }) {
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  // phase: 'start' | 'scanning' | 'processing' | 'error'
  const [phase,    setPhase]    = useState('start');
  const [errorMsg, setErrorMsg] = useState(null);
  const [camReady, setCamReady] = useState(false);

  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const { captureFrame, validating } = useFaceCapture();

  // ── Stream helpers ─────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
  }, []);

  const startStream = useCallback(async () => {
    setErrorMsg(null);
    setCamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      setPhase('scanning');
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCamReady(true);
        }
      });
    } catch {
      setErrorMsg('Camera access denied. Please allow camera permissions and try again.');
      setPhase('error');
    }
  }, []);

  const handleClose = useCallback(() => { stopStream(); onClose(); }, [stopStream, onClose]);
  useEffect(() => () => stopStream(), [stopStream]);

  // ── Scan & authenticate ────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (!videoRef.current || !camReady) return;

    // Client-side face detection (tiny model only)
    const { valid, error, base64 } = await captureFrame(videoRef.current);
    stopStream();

    if (!valid || !base64) {
      setErrorMsg(error || 'No face detected. Please try again.');
      setPhase('error');
      return;
    }

    setPhase('processing');
    setErrorMsg(null);

    // Send base64 image to backend — descriptor extraction happens server-side
    try {
      const res  = await fetch('http://localhost:3000/api/face-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: base64 }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Face not recognised');

      localStorage.setItem('token',        data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('username',     data.username);
      localStorage.setItem('userType',     data.user_type);
      if (data.user_id) localStorage.setItem('userId', data.user_id);

      stopStream();
      onSuccess(data);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  }, [camReady, captureFrame, stopStream, onSuccess]);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ${
        isDark ? 'bg-gray-900 border border-gray-700/60' : 'bg-white border border-gray-200'
      }`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? 'border-gray-700/50' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <ScanFace className="w-5 h-5 text-red-400" />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sign in with Face
            </span>
          </div>
          <button onClick={handleClose} className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Start ───────────────────────────────────────────────────── */}
          {phase === 'start' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
                <ScanFace className="w-9 h-9 text-red-400" />
              </div>
              <div className="text-center">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Sign in with your face</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Position your face in the frame and press Scan.
                </p>
              </div>
              <button
                onClick={startStream}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
              >
                <Camera className="w-4 h-4" /> Open Camera
              </button>
            </div>
          )}

          {/* ── Scanning ─────────────────────────────────────────────────── */}
          {phase === 'scanning' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="w-full rounded-xl object-cover"
                  style={{ maxHeight: 260 }}
                />
                {/* Oval guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-36 h-48 rounded-full border-2 border-dashed border-white/60" />
                </div>
                {!camReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Look directly at the camera, then press Scan.
              </p>
              <button
                onClick={handleScan}
                disabled={!camReady || validating}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
              >
                {validating
                  ? <><Loader className="w-4 h-4 animate-spin" /> Checking…</>
                  : <><ScanFace className="w-4 h-4" /> Scan My Face</>
                }
              </button>
            </div>
          )}

          {/* ── Processing ───────────────────────────────────────────────── */}
          {phase === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-red-500/20" />
                <div className="absolute inset-0 rounded-full border-t-4 border-red-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanFace className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <div className="text-center">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Verifying your face…</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This only takes a moment.</p>
              </div>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {phase === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <div className="text-center">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Recognition failed</p>
                <p className="text-sm text-red-400 mt-1">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setPhase('start'); setErrorMsg(null); }}
                className={`w-full py-2.5 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  isDark ? 'border-gray-600 hover:bg-gray-800 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
