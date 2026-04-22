import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Play, SkipForward, CheckCircle, X, Users,
  Clock, Calendar, RefreshCw, ChevronRight, AlertCircle,
  Video, UserCheck, Ban, Mic,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  createSession,
  cancelSession,
  startSession,
  getSessionStudents,
  nextStudent,
  skipStudent,
  completeSession,
  getSessionsByClass,
} from '../../services/sessions.service';
import { getLiveAssignments, getMyClasses } from '../../services/assignments.service';
import { useSessionSocket } from '../../hooks/useSessionSocket';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  scheduled: 'bg-blue-500/15   text-blue-400   border-blue-500/20',
  active:    'bg-green-500/15  text-green-400  border-green-500/20',
  completed: 'bg-gray-500/15   text-gray-400   border-gray-500/20',
  cancelled: 'bg-red-500/15    text-red-400    border-red-500/20',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status] || STATUS_STYLES.scheduled}`}>
    {status}
  </span>
);

// ─── Live session panel ───────────────────────────────────────────────────────

const LivePanel = ({ sessionId, isDark, onComplete }) => {
  const [data,          setData]         = useState(null);
  const [loading,       setLoading]      = useState(true);
  const [actionLoading, setAL]           = useState(false);
  const [error,         setError]        = useState('');
  const [remoteStream,  setRemoteStream] = useState(null);
  const videoRef = useRef(null);

  const userId = localStorage.getItem('userId') || '';

  const { connected, recording, cutTurn } = useSessionSocket({
    sessionId,
    role: 'instructor',
    userId,
    enabled: true,
    onRemoteStream: (stream) => {
      setRemoteStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    },
    onBlobSaved: () => { void load(); },
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSessionStudents(sessionId);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleNext = async () => {
    if (!data?.currentStudent) return;
    setAL(true);
    try {
      cutTurn();
      await nextStudent(sessionId, data.currentStudent._id);
      setRemoteStream(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to advance');
    } finally {
      setAL(false);
    }
  };

  const handleSkip = async () => {
    if (!data?.currentStudent) return;
    setAL(true);
    try {
      cutTurn();
      await skipStudent(sessionId, data.currentStudent._id);
      setRemoteStream(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to skip');
    } finally {
      setAL(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Complete this session?')) return;
    setAL(true);
    try {
      cutTurn();
      await completeSession(sessionId);
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete');
      setAL(false);
    }
  };

  if (loading) return (
    <div className="py-8 flex justify-center">
      <RefreshCw className="animate-spin text-red-500" size={28} />
    </div>
  );

  const {
    students = [],
    currentStudent,
    currentStudentIndex,
    recordedStudents = [],
    skippedStudents  = [],
  } = data || {};

  const recordedIds = recordedStudents.map((id) => id.toString());
  const skippedIds  = skippedStudents.map((id) => id.toString());

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Connection + recording status */}
      <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
        {connected ? 'Live — waiting for student stream' : 'Connecting...'}
        {recording && (
          <span className="flex items-center gap-1 text-red-400 font-medium ml-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Recording
          </span>
        )}
      </div>

      {/* Live student video / audio preview */}
      {remoteStream && (
        <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          {remoteStream.getVideoTracks().length > 0 ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-48 object-cover bg-black"
            />
          ) : (
            <div className={`flex items-center justify-center h-20 gap-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <Mic size={20} className="text-red-400 animate-pulse" />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Audio stream active
              </span>
            </div>
          )}
        </div>
      )}

      {/* Current student controls */}
      {currentStudent ? (
        <div className={`p-4 rounded-xl border-2 border-red-500/40 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            🎙 Current student
          </p>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {currentStudent.firstName} {currentStudent.lastName}
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentStudent.email}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={handleNext}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <ChevronRight size={14} />}
              Save & next
            </button>
            <button
              onClick={cutTurn}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              <X size={14} />
              Cut
            </button>
            <button
              onClick={handleSkip}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              <SkipForward size={14} />
              Skip
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            All students have been recorded.
          </p>
        </div>
      )}

      {/* Student list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {students.map((s, i) => {
          const id         = s._id.toString();
          const isRecorded = recordedIds.includes(id);
          const isSkipped  = skippedIds.includes(id);
          const isCurrent  = i === currentStudentIndex;
          return (
            <div
              key={id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                isCurrent
                  ? isDark ? 'bg-red-500/15 border-red-500/30'      : 'bg-red-50 border-red-200'
                  : isRecorded
                    ? isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
                    : isSkipped
                      ? isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
                      : isDark ? 'bg-white/5 border-white/10'            : 'bg-white border-gray-200'
              }`}
            >
              <span className={`text-xs font-bold w-6 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {s.firstName} {s.lastName}
                </p>
              </div>
              {isRecorded && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
              {isSkipped   && <SkipForward size={16} className="text-yellow-400 flex-shrink-0" />}
              {isCurrent   && <span className="text-xs font-bold text-red-400 flex-shrink-0">NOW</span>}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleComplete}
        disabled={actionLoading}
        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <CheckCircle size={16} />
        Complete session
      </button>
    </div>
  );
};

// ─── Sessions (Main) ──────────────────────────────────────────────────────────

const Sessions = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [classes,         setClasses]        = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classesLoading,  setClassesLoading]  = useState(true);

  const [sessions,      setSessions]      = useState([]);
  const [liveAssigns,   setLiveAssigns]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  const [form, setForm] = useState({
    title: '',
    assignmentId: '',
    scheduledDate: '',
    waitTimePerStudent: 5,
  });

  // ─── Load instructor's classes on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getMyClasses();
        setClasses(data);
        if (data.length === 1) setSelectedClassId(data[0]._id);
      } catch {
        setError('Failed to load your classes');
      } finally {
        setClassesLoading(false);
      }
    })();
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSessionsByClass(selectedClassId);
      setSessions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  const loadLiveAssignments = useCallback(async () => {
    try {
      const data = await getLiveAssignments(selectedClassId);
      setLiveAssigns(data);
    } catch {
      // non-fatal — list stays empty
    }
  }, [selectedClassId]);

  // ─── Fetch sessions & live assignments whenever selected class changes ────
  useEffect(() => {
    if (selectedClassId) {
      loadSessions();
      loadLiveAssignments();
    } else {
      setSessions([]);
      setLiveAssigns([]);
      setLoading(false);
    }
  }, [selectedClassId, loadSessions, loadLiveAssignments]);

  const showMsg = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else                    { setError(msg);   setTimeout(() => setError(''),   4000); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createSession({ ...form, classId: selectedClassId });
      showMsg('success', 'Session created!');
      setShowForm(false);
      setForm({ title: '', assignmentId: '', scheduledDate: '', waitTimePerStudent: 5 });
      loadSessions();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to create session');
    }
  };

  const handleStart = async (session) => {
    try {
      await startSession(session._id);
      setActiveSession(session._id);
      showMsg('success', 'Session started!');
      loadSessions();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Cannot start session');
    }
  };

  const handleCancel = async (session) => {
    if (!window.confirm(`Cancel session "${session.title}"?`)) return;
    try {
      await cancelSession(session._id);
      showMsg('success', 'Session cancelled.');
      loadSessions();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to cancel');
    }
  };

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-400 focus:ring-red-400/20'
      : 'bg-white border-gray-200 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
  }`;

  if (classesLoading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin h-10 w-10 text-red-500" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Live Sessions
          </h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Schedule and run oral presentation sessions for your class.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20"
        >
          <Plus size={18} />
          New session
        </button>
      </div>

      {/* Class selector bar */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
      }`}>
        <label className={`text-sm font-medium whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Viewing class:
        </label>
        <select
          value={selectedClassId}
          onChange={e => { setSelectedClassId(e.target.value); setActiveSession(null); }}
          className={`${inputCls} max-w-xs`}
        >
          <option value="">— Select a class —</option>
          {classes.map(cls => (
            <option key={cls._id} value={cls._id}>{cls.name}</option>
          ))}
        </select>
        {selectedClassId && loading && (
          <RefreshCw size={16} className="animate-spin text-red-500 ml-1" />
        )}
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

      {/* Create form */}
      {showForm && (
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Schedule New Session
            </h3>
            <button onClick={() => setShowForm(false)}>
              <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Session title *
              </label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={inputCls} placeholder="e.g. B2 Oral — Group A"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Assignment (Live type) *
              </label>
              <select
                required value={form.assignmentId}
                onChange={e => setForm(p => ({ ...p, assignmentId: e.target.value }))}
                className={inputCls}
              >
                <option value="">— Select a live assignment —</option>
                {liveAssigns.map(a => (
                  <option key={a._id} value={a._id}>{a.title}</option>
                ))}
              </select>
              {liveAssigns.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">
                  No live assignments found. Create an assignment with type "Live" first.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Scheduled date *
                </label>
                <input
                  type="datetime-local" required value={form.scheduledDate}
                  onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Wait time per student (min) *
                </label>
                <input
                  type="number" required min="1" max="60"
                  value={form.waitTimePerStudent}
                  onChange={e => setForm(p => ({ ...p, waitTimePerStudent: +e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all">
                Schedule session
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Session list */}
      {!selectedClassId ? (
        <div className={`${card} p-12 text-center`}>
          <Users className={`w-12 h-12 mx-auto mb-4 opacity-50 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Select a class above to view its sessions
          </p>
        </div>

      ) : sessions.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <Video className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No sessions yet</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Schedule a session to start live oral recordings.
          </p>
        </div>

      ) : (
        <div className="space-y-4">
          {sessions.map(session => {
            const isActive = session.status === 'active';
            const isLive   = activeSession === session._id;

            return (
              <div key={session._id} className={`${card} overflow-hidden`}>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {session.title}
                        </h3>
                        <StatusBadge status={session.status} />
                      </div>
                      <div className={`flex items-center flex-wrap gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(session.scheduledDate).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {session.waitTimePerStudent} min/student
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {session.status === 'scheduled' && (
                        <button
                          onClick={() => handleStart(session)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-all"
                        >
                          <Play size={14} />
                          Start
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => setActiveSession(isLive ? null : session._id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isLive
                              ? 'bg-red-500 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          <UserCheck size={14} />
                          {isLive ? 'Hide panel' : 'Open live panel'}
                        </button>
                      )}
                      {(session.status === 'scheduled' || session.status === 'active') && (
                        <button
                          onClick={() => handleCancel(session)}
                          title="Cancel session"
                          className={`p-2 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                          }`}
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isLive && isActive && (
                  <div className={`border-t px-6 py-5 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <LivePanel
                      sessionId={session._id}
                      isDark={isDark}
                      onComplete={() => { setActiveSession(null); loadSessions(); }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sessions;