import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const NS = '/sessions-live';

export function useSessionSocket({
  sessionId,
  role,
  userId,
  enabled = true,
  onYourTurn,
  onTurnEnded,
  onRemoteStream,
  onBlobSaved,
}) {
  const cbRefs = useRef({ onYourTurn, onTurnEnded, onRemoteStream, onBlobSaved });
  useEffect(() => {
    cbRefs.current = { onYourTurn, onTurnEnded, onRemoteStream, onBlobSaved };
  });

  const socketRef             = useRef(null);
  const peerRef               = useRef(null);
  const recorderRef           = useRef(null);
  const chunksRef             = useRef([]);
  const streamRef             = useRef(null);
  const timerRef              = useRef(null);
  const turnMetaRef           = useRef(null);
  const iceCandidateQueueRef  = useRef([]);
  const remoteDescSetRef      = useRef(false);
  const currentTurnIdRef      = useRef(null);
  const recordingStudentIdRef = useRef(null);
  const blobUploadResolveRef  = useRef(null);
  // Prevents duplicate webrtc-answer events from calling setRemoteDescription twice
  const answerAppliedRef      = useRef(false);

  const [recording,    setRecording]    = useState(false);
  const [countdown,    setCountdown]    = useState(0);
  const [connected,    setConnected]    = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream,  setLocalStream]  = useState(null);
  const [micEnabled,   setMicEnabled]   = useState(true);
  const [cameraEnabled,setCameraEnabled]= useState(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const stopStudentTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    setMicEnabled(true);
    setCameraEnabled(true);
  }, []);

  const closePeer = useCallback(() => {
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    iceCandidateQueueRef.current = [];
    remoteDescSetRef.current     = false;
    answerAppliedRef.current     = false; // reset on every new peer
  }, []);

  const sessionIdRef = useRef(sessionId);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // ── Upload blob ───────────────────────────────────────────────────────────

  const uploadBlob = useCallback(async (chunks, fileType) => {
    const resolve = blobUploadResolveRef.current;
    blobUploadResolveRef.current = null;

    if (!chunks.length || !sessionIdRef.current) {
      socketRef.current?.emit('end-turn', { sessionId: sessionIdRef.current });
      resolve?.();
      return;
    }

    const mimeType = fileType === 'video' ? 'video/webm' : 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });

  if (blob.size < 1000) {
    console.warn('Blob too small, skipping upload');
    socketRef.current?.emit('end-turn', { sessionId: sessionIdRef.current });
    resolve?.();
    return;
  }
    const formData = new FormData();
    formData.append('file',     blob, 'recording.webm');
    formData.append('fileType', fileType);
    formData.append('source',   'instructor');

    if (recordingStudentIdRef.current) {
      formData.append('studentId', recordingStudentIdRef.current);
      recordingStudentIdRef.current = null;
    }

    try {
      await api.post(
        `/recordings/session/${sessionIdRef.current}/save-blob`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      cbRefs.current.onBlobSaved?.();
    } catch (err) {
      console.error('Blob upload failed:', err);
    } finally {
      // end-turn fires after the HTTP request so the session document is
      // still intact when saveBlobRecording's findOne() runs
      socketRef.current?.emit('end-turn', { sessionId: sessionIdRef.current });
      resolve?.();
    }
  }, []);

  // ── Stop recorder (cleanup path) ─────────────────────────────────────────

  const stopInstructorRecorder = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    clearTimer();
    setRecording(false);
    setCountdown(0);
  }, [clearTimer]);

  // ── cutTurn ───────────────────────────────────────────────────────────────

  const cutTurn = useCallback((studentId) => {
    if (studentId) recordingStudentIdRef.current = studentId;
    clearTimer();
    setRecording(false);
    setCountdown(0);

    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        recorderRef.current = null;
        socketRef.current?.emit('end-turn', { sessionId: sessionIdRef.current });
        resolve();
        return;
      }
      blobUploadResolveRef.current = resolve;
      recorder.stop();
      recorderRef.current = null;
    });
  }, [clearTimer]);

  // ── callStudent ───────────────────────────────────────────────────────────

  const callStudent = useCallback((studentId, durationSeconds, mediaType) => {
    socketRef.current?.emit('call-student', {
      sessionId: sessionIdRef.current,
      studentId,
      durationSeconds,
      mediaType,
    });
  }, []);

  // ── Student toggles ───────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    const next = !tracks[0]?.enabled;
    tracks.forEach((t) => { t.enabled = next; });
    setMicEnabled(next);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    if (!tracks.length) return;
    const next = !tracks[0]?.enabled;
    tracks.forEach((t) => { t.enabled = next; });
    setCameraEnabled(next);
  }, []);

  // ── ICE queue ────────────────────────────────────────────────────────────

  const flushIceQueue = useCallback(async () => {
    const pc = peerRef.current;
    if (!pc) return;
    for (const candidate of iceCandidateQueueRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (err) { console.warn('ICE flush failed:', err); }
    }
    iceCandidateQueueRef.current = [];
  }, []);

  // ── Instructor peer ───────────────────────────────────────────────────────

  const createInstructorPeer = useCallback((socket) => {
    closePeer();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerRef.current = pc;

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;

      setRemoteStream(stream);
      cbRefs.current.onRemoteStream?.(stream);

      // Reset chunks for this new turn
      chunksRef.current = [];
      const hasVideo = stream.getVideoTracks().length > 0;
      const fileType = hasVideo ? 'video' : 'audio';

      const getSupportedMimeType = (hasVideo) => {
        const types = hasVideo
          ? [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm',
            ]
          : [
              'audio/webm;codecs=opus',
              'audio/webm',
            ];

        return types.find(type => MediaRecorder.isTypeSupported(type));
      };

      const mimeType = getSupportedMimeType(hasVideo);

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        try {
          recorder.requestData(); // force final chunk
        } catch (err) {
          console.warn('requestData failed:', err);
        }

        const capturedChunks = [...chunksRef.current];
        chunksRef.current = [];

        if (!capturedChunks.length) {
          console.warn('No chunks recorded');
          setRecording(false);
          return;
        }

        await uploadBlob(capturedChunks, fileType);
        setRecording(false);
      };

      setTimeout(() => {
        recorder.start(1000);
      }, 300);
      setRecording(true);

      const dur = turnMetaRef.current?.durationSeconds;
      if (dur) {
        setCountdown(dur);
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearTimer();
              if (recorderRef.current && recorderRef.current.state !== 'inactive') {
                recorderRef.current.stop();
              }
              recorderRef.current = null;
              setRecording(false);
              setCountdown(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', {
          sessionId: sessionIdRef.current,
          candidate: e.candidate,
          to: 'student',
        });
      }
    };

    return pc;
  }, [closePeer, uploadBlob, clearTimer]);

  // ── Student peer ──────────────────────────────────────────────────────────

  const createStudentPeer = useCallback((socket, stream) => {
    closePeer();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerRef.current      = pc;
    answerAppliedRef.current = false; // fresh peer, no answer yet

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', {
          sessionId: sessionIdRef.current,
          candidate: e.candidate,
          to: 'teacher',
        });
      }
    };

    return pc;
  }, [closePeer]);

  // ── Student: your-turn ────────────────────────────────────────────────────

  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const handleYourTurn = useCallback(async (data, socket) => {
    if (data.studentId !== userIdRef.current) return;
    turnMetaRef.current = data;
    cbRefs.current.onYourTurn?.(data);

    const turnId = `${Date.now()}-${Math.random()}`;
    currentTurnIdRef.current = turnId;

    try {
      const mediaType   = data.mediaType === 'both' ? 'video' : data.mediaType;
      const constraints =
        mediaType === 'audio'
          ? { audio: true }
          : { audio: true, video: { width: 1280, height: 720 } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (currentTurnIdRef.current !== turnId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      setLocalStream(stream);
      setMicEnabled(true);
      setCameraEnabled(stream.getVideoTracks().length > 0);

      const pc    = createStudentPeer(socket, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { sessionId: sessionIdRef.current, offer, turnId });
    } catch (err) {
      console.error('Student getUserMedia/offer failed:', err);
    }
  }, [createStudentPeer]);

  // ── Student: turn-ended ───────────────────────────────────────────────────

  const handleTurnEnded = useCallback((data) => {
    currentTurnIdRef.current = null;
    stopStudentTracks();
    closePeer();
    cbRefs.current.onTurnEnded?.(data);
  }, [stopStudentTracks, closePeer]);

  // ── Socket lifecycle ──────────────────────────────────────────────────────

  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);

  useEffect(() => {
    if (!enabled || !sessionId || !userId) return;
    let cancelled = false;

    const socket = io(`${SOCKET_URL}${NS}`, {
      auth:         { token: localStorage.getItem('token') },
      transports:   ['websocket'],
      reconnection: false,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (cancelled) return;
      setConnected(true);
      socket.emit('join-session', {
        sessionId: sessionIdRef.current,
        role:      roleRef.current,
        userId:    userIdRef.current,
      });
    });

    socket.on('disconnect', () => { if (!cancelled) setConnected(false); });

    socket.on('your-turn', (data) => {
      if (roleRef.current !== 'student') return;
      void handleYourTurn(data, socket);
    });

    socket.on('turn-ended', (data) => {
      if (roleRef.current !== 'student') return;
      handleTurnEnded(data);
    });

    socket.on('webrtc-answer', async ({ answer, turnId }) => {
      if (roleRef.current !== 'student') return;

      // ── FIX 2: guard against duplicate answer events.
      // answerAppliedRef is reset in createStudentPeer (new peer = new turn).
      // If the socket replays the event or the server sends it twice,
      // the second call is silently dropped instead of crashing with
      // "Called in wrong state: stable".
      if (answerAppliedRef.current) {
        console.warn('Dropping duplicate webrtc-answer — already applied');
        return;
      }
      if (turnId && turnId !== currentTurnIdRef.current) {
        console.warn('Dropping stale webrtc-answer for turnId:', turnId);
        return;
      }

      const pc = peerRef.current;
      if (!pc) return;
      if (pc.signalingState !== 'have-local-offer') {
        console.warn('Ignoring answer in unexpected signaling state:', pc.signalingState);
        return;
      }

      try {
        answerAppliedRef.current = true; // mark before the async call
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSetRef.current = true;
        await flushIceQueue();
      } catch (err) {
        answerAppliedRef.current = false; // allow retry on genuine error
        console.error('setRemoteDescription (answer) failed:', err);
      }
    });

    socket.on('webrtc-offer', async ({ offer, turnId }) => {
      if (roleRef.current !== 'instructor') return;
      const pc = createInstructorPeer(socket);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await flushIceQueue();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { sessionId: sessionIdRef.current, answer, turnId });
      } catch (err) {
        console.error('setRemoteDescription (offer) failed:', err);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerRef.current;
      if (!pc) return;
      if (remoteDescSetRef.current) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (err) { console.warn('addIceCandidate failed:', err); }
      } else {
        iceCandidateQueueRef.current.push(candidate);
      }
    });

    return () => {
      cancelled = true;
      currentTurnIdRef.current     = null;
      blobUploadResolveRef.current = null;
      clearTimer();
      stopStudentTracks();
      stopInstructorRecorder();
      closePeer();
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.on('connect', () => socket.disconnect());
      }
      setConnected(false);
      setRemoteStream(null);
    };
  }, [
    enabled, sessionId, userId,
    handleYourTurn, handleTurnEnded, createInstructorPeer,
    flushIceQueue, clearTimer, stopStudentTracks, stopInstructorRecorder, closePeer,
  ]);

  return {
    connected, recording, countdown, remoteStream, cutTurn, callStudent,
    localStream, micEnabled, cameraEnabled, toggleMic, toggleCamera,
  };
}