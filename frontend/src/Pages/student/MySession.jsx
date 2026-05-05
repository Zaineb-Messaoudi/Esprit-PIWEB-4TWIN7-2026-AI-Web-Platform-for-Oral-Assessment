import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock, RefreshCw, CheckCircle, AlertCircle,
  Mic, MicOff, Video, VideoOff,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import { getSessionsByClass, getMySlot } from '../../services/sessions.service';
import { useSessionSocket } from '../../hooks/useSessionSocket';

const SlotStatus = ({ status, isDark }) => {
  const styles = {
    waiting: {
      text: '⏳ Waiting',
      cls: isDark
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/20'
        : 'bg-amber-50 text-amber-700 border-amber-200',
    },
    current: {
      text: '🎙 Your turn now',
      cls: isDark
        ? 'bg-red-500/15 text-red-300 border-red-500/20'
        : 'bg-red-50 text-red-700 border-red-200',
    },
    done: {
      text: '✅ Recorded',
      cls: isDark
        ? 'bg-green-500/15 text-green-300 border-green-500/20'
        : 'bg-green-50 text-green-700 border-green-200',
    },
    skipped: {
      text: '⏭ Skipped',
      cls: isDark
        ? 'bg-gray-500/15 text-gray-300 border-gray-500/20'
        : 'bg-gray-50 text-gray-600 border-gray-200',
    },
  };
  const s = styles[status] || styles.waiting;
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${s.cls}`}>
      {s.text}
    </span>
  );
};

const MySession = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const classId = localStorage.getItem('classId') || '';
  const userId  = localStorage.getItem('userId')  || '';

  const [sessions,        setSessions]        = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [slot,            setSlot]            = useState(null);
  const [loadingSlot,     setLoadingSlot]     = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [isMyTurn,        setIsMyTurn]        = useState(false);
  const [turnDuration,    setTurnDuration]    = useState(0);

  const localVideoRef = useRef(null);

  const showMsg = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
    else                    { setError(msg);   setTimeout(() => setError(''),   4000); }
  };

  const loadSlot = useCallback(async (sessionId) => {
    setLoadingSlot(true);
    try {
      const data = await getMySlot(sessionId);
      setSlot(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your slot');
    } finally {
      setLoadingSlot(false);
    }
  }, []);

  const { connected, localStream, micEnabled, cameraEnabled, toggleMic, toggleCamera } =
    useSessionSocket({
      sessionId: selectedSession?._id ?? null,
      role: 'student',
      userId,
      enabled: !!selectedSession && !!userId,

      onYourTurn: (data) => {
        setIsMyTurn(true);
        setTurnDuration(data.durationSeconds ?? 0);
        showMsg('success', `🎙 It's your turn! Recording for ${Math.round((data.durationSeconds ?? 0) / 60)} min.`);
        if (selectedSession) void loadSlot(selectedSession._id);
      },

      onTurnEnded: () => {
        setIsMyTurn(false);
        setTurnDuration(0);
        // Optimistic update: mark slot as done immediately so the UI shows
        // "Recorded" instead of flashing "waiting for teacher to call you".
        // Since end-turn now fires after the blob upload, nextStudent will run
        // shortly after — the delayed loadSlot call syncs any final state.
        setSlot((prev) => (prev ? { ...prev, status: 'done' } : prev));
        showMsg('success', '✅ Your turn has ended. Recording saved!');
        // Refresh from server after a short delay to pick up the final state
        if (selectedSession) {
          setTimeout(() => void loadSlot(selectedSession._id), 2500);
        }
      },
    });

  useEffect(() => {
    if (localVideoRef.current && localStream)  localVideoRef.current.srcObject = localStream;
    if (localVideoRef.current && !localStream) localVideoRef.current.srcObject = null;
  }, [localStream]);

  useEffect(() => {
    setIsMyTurn(false);
    setTurnDuration(0);
  }, [selectedSession?._id]);

  useEffect(() => {
    if (!classId) { setError('No class found. Visit "My Class" first.'); return; }
    (async () => {
      try {
        const data = await getSessionsByClass(classId);
        setSessions(data.filter((s) => s.status === 'scheduled' || s.status === 'active'));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load sessions');
      }
    })();
  }, [classId]);

  useEffect(() => {
    if (selectedSession) loadSlot(selectedSession._id);
  }, [selectedSession, loadSlot]);

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  const hasVideo = localStream?.getVideoTracks().length > 0;

  return (
    <div className="space-y-6">

      <div>
        <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>My Session</h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Check your position and record when it's your turn.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <Clock className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No active or upcoming sessions</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Your instructor hasn't scheduled a session yet.
          </p>
        </div>
      ) : (
        <>
          <div className={`${card} p-6`}>
            <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Select a session
            </label>
            <div className="space-y-2">
              {sessions.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setSelectedSession(s)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedSession?._id === s._id
                      ? isDark ? 'bg-red-500/15 border-red-500/30' : 'bg-red-50 border-red-300'
                      : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.title}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(s.scheduledDate).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                    s.status === 'active'
                      ? 'bg-green-500/15 text-green-400 border-green-500/20'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                  }`}>
                    {s.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedSession && (
            <div className={`${card} p-6`}>
              {loadingSlot ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="animate-spin text-red-500" size={24} />
                </div>
              ) : slot ? (
                <div className="space-y-4">

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Your position
                      </p>
                      <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>#{slot.position}</p>
                    </div>
                    <SlotStatus status={slot.status} isDark={isDark} />
                  </div>

                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Clock size={14} />
                    Estimated time:{' '}
                    <span className="font-semibold">
                      {new Date(slot.estimatedTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {selectedSession.waitTimePerStudent && (
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Each student has ~{selectedSession.waitTimePerStudent} minutes.
                    </p>
                  )}

                  {/* ── Live recording block ── */}
                  {slot.status === 'current' && (
                    <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      {!connected && (
                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <RefreshCw size={14} className="animate-spin" />
                          Connecting to session...
                        </div>
                      )}
                      {connected && !isMyTurn && (
                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          <Clock size={14} />
                          Connected — waiting for teacher to call you...
                        </div>
                      )}
                      {isMyTurn && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              🎙 Streaming to teacher
                            </span>
                            {turnDuration > 0 && (
                              <span className={`text-sm font-mono font-bold tabular-nums ${
                                turnDuration <= 30 ? 'text-red-500' : isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {Math.floor(turnDuration / 60)}:{String(turnDuration % 60).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <div className={`relative rounded-xl overflow-hidden border ${
                            isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-gray-900'
                          }`}>
                            {hasVideo ? (
                              <>
                                <video
                                  ref={localVideoRef}
                                  autoPlay muted playsInline
                                  className="w-full object-cover"
                                  style={{ maxHeight: '240px', display: 'block', transform: 'scaleX(-1)' }}
                                />
                                {!cameraEnabled && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                      <VideoOff size={32} />
                                      <span className="text-xs">Camera off</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-36 gap-3">
                                <div className="flex items-end gap-1 h-10">
                                  {Array.from({ length: 18 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-1.5 rounded-full ${micEnabled ? 'bg-red-400' : 'bg-gray-600'}`}
                                      style={{
                                        height: `${25 + Math.sin(i * 0.9) * 18}%`,
                                        animation: micEnabled ? `wave ${0.4 + (i % 5) * 0.09}s ease-in-out infinite alternate` : 'none',
                                        animationDelay: `${i * 0.04}s`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {micEnabled ? 'Audio streaming...' : 'Microphone muted'}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={toggleMic}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                micEnabled
                                  ? isDark ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  : 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                              }`}
                            >
                              {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                              {micEnabled ? 'Mute' : 'Unmute'}
                            </button>
                            {hasVideo && (
                              <button
                                onClick={toggleCamera}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                  cameraEnabled
                                    ? isDark ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    : 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                                }`}
                              >
                                {cameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                                {cameraEnabled ? 'Camera off' : 'Camera on'}
                              </button>
                            )}
                            <p className={`text-xs ml-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              Teacher is recording
                            </p>
                          </div>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Recording stops automatically when time runs out or the teacher ends it.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {slot.status === 'done' && (
                    <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                        ✅ Your recording has been saved. Check your submission history for the result.
                      </p>
                    </div>
                  )}

                  {slot.status === 'skipped' && (
                    <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        ⏭ You were skipped. Please contact your instructor.
                      </p>
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
};

export default MySession;