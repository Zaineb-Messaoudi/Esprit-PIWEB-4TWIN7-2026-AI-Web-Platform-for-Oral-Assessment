import { useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

// ── Model loader (singleton) ───────────────────────────────────────────────
let modelLoaded = false;

async function loadDetectorModel() {
  if (modelLoaded) return;
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  modelLoaded = true;
}

function detectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useFaceCapture() {
  const [validating, setValidating] = useState(false);

  // ── validateImage: used in FaceCapture (file upload) ──────────────────
  const validateImage = useCallback(async (file) => {
    setValidating(true);
    try {
      await loadDetectorModel();

      const base64 = await fileToBase64(file);
      const img    = await createImageElement(base64);

      const detections = await faceapi.detectAllFaces(img, detectorOptions());
      const count      = detections.length;

      if (count === 0) return { valid: false, error: 'No face detected. Look directly at the camera.', base64: null };
      if (count > 1)   return { valid: false, error: `${count} faces detected. Only one person should be in frame.`, base64: null };

      return { valid: true, error: null, base64 };
    } catch (err) {
      console.error('[useFaceCapture] validateImage error:', err);
      try {
        const base64 = await fileToBase64(file);
        return { valid: true, error: null, base64 };
      } catch {
        return { valid: false, error: 'Failed to read image.', base64: null };
      }
    } finally {
      setValidating(false);
    }
  }, []);

  // ── captureFrame: used in FaceCapture (webcam) & FaceLoginModal ────────
  const captureFrame = useCallback(async (video) => {
    setValidating(true);
    try {
      await loadDetectorModel();

      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const detections = await faceapi.detectAllFaces(canvas, detectorOptions());
      const count      = detections.length;

      if (count === 0) return { valid: false, error: 'No face detected. Look directly at the camera.', base64: null };
      if (count > 1)   return { valid: false, error: `${count} faces detected. Only one person should be in frame.`, base64: null };

      const base64 = canvas.toDataURL('image/jpeg', 0.92);
      return { valid: true, error: null, base64 };
    } catch (err) {
      console.error('[useFaceCapture] captureFrame error:', err);
      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      return { valid: true, error: null, base64: canvas.toDataURL('image/jpeg', 0.92) };
    } finally {
      setValidating(false);
    }
  }, []);

  return { validateImage, captureFrame, validating };
}

// ── Helpers ───────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader   = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

function createImageElement(src) {
  return new Promise((resolve, reject) => {
    const img   = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}