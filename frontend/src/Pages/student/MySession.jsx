import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, RefreshCw, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  getSessionsByClass,
  getMySlot,
} from '../../services/sessions.service';
import { useSessionSocket } from '../../hooks/useSessionSocket';

// ─── Status pill ──────────────────────────────────────────────────────────────

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

// ─── MySession (Main) ─────────────────────────────────────────────────────────

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

  // ── Socket + recording hook ───────────────────────────────────────────────

  const { connected, recording, countdown } = useSessionSocket({
    sessionId: selectedSession?._id ?? null,
    role: 'student',
    userId,
    enabled: !!selectedSession && !!userId,
    onYourTurn: (data) => {
      showMsg(
        'success',
        `🎙 It's your turn! Recording for ${Math.round(data.durationSeconds / 60)} min.`,
      );
      if (selectedSession) void loadSlot(selectedSession._id);
    },
    onTurnEnded: () => {
      showMsg('success', 'Your turn has ended. Recording saved.');
      if (selectedSession) void loadSlot(selectedSession._id);
    },
    onBlobSaved: () => {
      showMsg('success', 'Recording submitted successfully!');
      if (selectedSession) void loadSlot(selectedSession._id);
    },
  });

  // ── Load sessions ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!classId) {
      setError('No class found. Visit "My Class" first.');
      return;
    }
    (async () => {
      try {
        const data = await getSessionsByClass(classId);
        const relevant = data.filter(
          (s) => s.status === 'scheduled' || s.status === 'active',
        );
        setSessions(relevant);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load sessions');
      }
    })();
  }, [classId]);

  // ── Load slot ─────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (selectedSession) loadSlot(selectedSession._id);
  }, [selectedSession, loadSlot]);

  const showMsg = (type, msg) => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          My Session
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Check your position and record when it's your turn.
        </p>
      </div>

      {/* Alerts */}
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

      {/* Session picker */}
      {sessions.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <Clock className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            No active or upcoming sessions
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Your instructor hasn't scheduled a session yet.
          </p>
        </div>
      ) : (
        <>
          {/* Session list */}
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
                      ? isDark
                        ? 'bg-red-500/15 border-red-500/30'
                        : 'bg-red-50 border-red-300'
                      : isDark
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {s.title}
                    </p>
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

          {/* Slot info */}
          {selectedSession && (
            <div className={`${card} p-6`}>
              {loadingSlot ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="animate-spin text-red-500" size={24} />
                </div>
              ) : slot ? (
                <div className="space-y-4">

                  {/* Position + status */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Your position
                      </p>
                      <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        #{slot.position}
                      </p>
                    </div>
                    <SlotStatus status={slot.status} isDark={isDark} />
                  </div>

                  {/* Estimated time */}
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Clock size={14} />
                    Estimated time:{' '}
                    <span className="font-semibold">
                      {new Date(slot.estimatedTime).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Per-student duration */}
                  {selectedSession.waitTimePerStudent && (
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Each student has ~{selectedSession.waitTimePerStudent} minutes.
                    </p>
                  )}

                  {/* ── Recording status block — auto-managed by hook ── */}
                  {slot.status === 'current' && (
                    <div className="pt-2 border-t border-white/10">

                      {/* Not yet connected to socket */}
                      {!connected && (
                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <RefreshCw size={14} className="animate-spin" />
                          Connecting to session...
                        </div>
                      )}

                      {/* Connected, waiting for teacher to start */}
                      {connected && !recording && (
                        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          <Clock size={14} />
                          Connected — waiting for teacher to start your recording...
                        </div>
                      )}

                      {/* Actively recording */}
                      {recording && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-2 text-red-400 text-sm font-medium">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              Recording in progress
                            </span>
                            {countdown > 0 && (
                              <span className={`text-sm font-mono font-bold tabular-nums ${
                                countdown <= 30
                                  ? 'text-red-500'
                                  : isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Recording stops automatically when time runs out or the teacher ends it.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Done / skipped message */}
                  {slot.status === 'done' && (
                    <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                        ✅ Your recording has been saved. Check your submission history for the result.
                      </p>
                    </div>
                  )}

                  {slot.status === 'skipped' && (
                    <div className={`pt-2 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
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
    </div>
  );
};

export default MySession;