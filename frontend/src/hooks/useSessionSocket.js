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
  const socketRef   = useRef(null);
  const peerRef     = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);

  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [connected, setConnected] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopRecorder = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Upload blob
  // ─────────────────────────────────────────────────────────────

  const uploadBlob = useCallback(async (chunks, fileType, source) => {
    if (!chunks.length) return;

    const mimeType = fileType === 'video' ? 'video/webm' : 'audio/webm';
    const blob = new Blob(chunks, { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, `recording.webm`);
    formData.append('fileType', fileType);
    formData.append('source', source);

    try {
      await api.post(
        `/recordings/session/${sessionId}/save-blob`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onBlobSaved?.();
    } catch (err) {
      console.error('Blob upload failed:', err);
    }
  }, [sessionId, onBlobSaved]);

  // ─────────────────────────────────────────────────────────────
  // Local recording (student)
  // ─────────────────────────────────────────────────────────────

  const startLocalRecording = useCallback(async (mediaType, durationSeconds) => {
    const constraints =
      mediaType === 'audio'
        ? { audio: true }
        : { audio: true, video: { width: 1280, height: 720 } };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const fileType = mediaType === 'audio' ? 'audio' : 'video';
        uploadBlob(chunksRef.current, fileType, 'student');
        stopAllTracks();
        setRecording(false);
        clearTimer();
      };

      recorder.start(1000);
      setRecording(true);
      setCountdown(durationSeconds);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearTimer();
            stopRecorder();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('getUserMedia failed:', err);
    }
  }, [uploadBlob, stopAllTracks, stopRecorder, clearTimer]);

  // ─────────────────────────────────────────────────────────────
  // WebRTC
  // ─────────────────────────────────────────────────────────────

  const createPeer = useCallback((socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerRef.current = pc;

    if (role === 'instructor') {
      pc.ontrack = (e) => {
        const stream = e.streams[0];
        onRemoteStream?.(stream);

        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };

        recorder.onstop = () => {
          const hasVideo = stream.getVideoTracks().length > 0;
          uploadBlob(chunksRef.current, hasVideo ? 'video' : 'audio', 'instructor');
          setRecording(false);
        };

        recorder.start(1000);
        setRecording(true);
      };
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', {
          sessionId,
          candidate: e.candidate,
          to: role === 'instructor' ? 'student' : 'teacher',
        });
      }
    };

    return pc;
  }, [role, sessionId, onRemoteStream, uploadBlob]);

  // ─────────────────────────────────────────────────────────────
  // Socket connection (STABLE)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !sessionId || !userId) return;

    const socket = io(`${SOCKET_URL}${NS}`, {
      auth: { token: localStorage.getItem('token') },
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-session', { sessionId, role, userId });
    });

    socket.on('disconnect', () => setConnected(false));

    return () => {
      clearTimer();
      stopRecorder();
      stopAllTracks();
      peerRef.current?.close();
      peerRef.current = null;
      socket.disconnect();
      setConnected(false);
    };
  }, [enabled, sessionId, role, userId, clearTimer, stopRecorder, stopAllTracks]);

  // ─────────────────────────────────────────────────────────────
  // Socket event bindings (SEPARATE)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleYourTurn = (data) => {
      if (role !== 'student') return;
      if (data.studentId !== userId) return;

      onYourTurn?.(data);

      startLocalRecording(
        data.mediaType === 'both' ? 'video' : data.mediaType,
        data.durationSeconds
      );
    };

    const handleTurnEnded = (data) => {
      if (role !== 'student') return;
      stopRecorder();
      clearTimer();
      onTurnEnded?.(data);
    };

    socket.on('your-turn', handleYourTurn);
    socket.on('turn-ended', handleTurnEnded);

    return () => {
      socket.off('your-turn', handleYourTurn);
      socket.off('turn-ended', handleTurnEnded);
    };
  }, [role, userId, onYourTurn, onTurnEnded, startLocalRecording, stopRecorder, clearTimer]);

  // ─────────────────────────────────────────────────────────────
  // WebRTC signaling handlers
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleOffer = async ({ offer }) => {
      if (role !== 'instructor') return;

      const pc = createPeer(socket);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc-answer', { sessionId, answer });
    };

    const handleAnswer = async ({ answer }) => {
      if (role !== 'student' || !peerRef.current) return;

      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const handleIce = async ({ candidate }) => {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('ice-candidate', handleIce);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('ice-candidate', handleIce);
    };
  }, [role, sessionId, createPeer]);

  // ─────────────────────────────────────────────────────────────
  // Initiate WebRTC (student)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (recording && role === 'student') {
      const initiate = async () => {
        const socket = socketRef.current;
        if (!socket || !streamRef.current) return;

        const pc = createPeer(socket);

        streamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, streamRef.current);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', { sessionId, offer });
      };

      initiate();
    }
  }, [recording, role, sessionId, createPeer]);

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  const cutTurn = useCallback(() => {
    socketRef.current?.emit('end-turn', { sessionId });
    stopRecorder();
    clearTimer();
  }, [sessionId, stopRecorder, clearTimer]);

  const callStudent = useCallback((studentId, durationSeconds, mediaType) => {
    socketRef.current?.emit('call-student', {
      sessionId,
      studentId,
      durationSeconds,
      mediaType,
    });
  }, [sessionId]);

  return {
    connected,
    recording,
    countdown,
    cutTurn,
    callStudent,
    stopRecorder,
  };
}