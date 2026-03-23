import { useCallback, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_URL = '/models';

let modelsLoaded = false;
let modelsLoading = false;
let modelsLoadPromise = null;

const loadModels = () => {
  if (modelsLoaded) return Promise.resolve();

  if (modelsLoading) return modelsLoadPromise;

  modelsLoading = true;
  modelsLoadPromise = faceapi.nets.tinyFaceDetector
    .loadFromUri(MODELS_URL)
    .then(() => {
      modelsLoaded = true;
      modelsLoading = false;
    })
    .catch((err) => {
      modelsLoading = false;
      modelsLoadPromise = null;
      throw err;
    });

  return modelsLoadPromise;
};

/**
 * useFaceValidation
 *
 * Returns:
 *  - validateFace(file)  → Promise<{ valid: boolean, error: string | null }>
 *  - validating          → boolean (true while detection is running)
 */
export const useFaceValidation = () => {
  const [validating, setValidating] = useState(false);
  const imgRef = useRef(null);

  const validateFace = useCallback(async (file) => {
    setValidating(true);

    try {
      // ── Load models if not already loaded ──────────────────────────────
      await loadModels();

      // ── Draw file into a temporary HTMLImageElement ────────────────────
      const imageUrl = URL.createObjectURL(file);
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Failed to load image'));
        el.src = imageUrl;
      });
      imgRef.current = img;
      URL.revokeObjectURL(imageUrl);

      // ── Run detection ──────────────────────────────────────────────────
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
      );

      const count = detections.length;

      if (count === 0) {
        return { valid: false, error: 'No face detected. Please upload a clear photo of your face.' };
      }

      if (count > 1) {
        return { valid: false, error: `${count} faces detected. Please upload a photo with only your face.` };
      }

      return { valid: true, error: null };

    } catch (err) {
      console.error('Face validation error:', err);
      // If models fail to load, fail open (don't block the user)
      return { valid: true, error: null };
    } finally {
      setValidating(false);
    }
  }, []);

  return { validateFace, validating };
};
