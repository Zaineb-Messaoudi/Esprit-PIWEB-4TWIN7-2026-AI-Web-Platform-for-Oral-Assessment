import React, { useState, useEffect, useRef } from 'react';

const LiveRecording = ({ classId, studentId, isInstructor, duration = 10000 }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(studentId || '');
  const [recordingChunks, setRecordingChunks] = useState([]);
  const [preview, setPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null); // 🎥 live preview

  useEffect(() => {
    if (isInstructor) {
      fetch(`/api/classes/${classId}/students`)
        .then(res => res.json())
        .then(data => setStudents(data || []))
        .catch(err => console.error(err));
    }
  }, [classId, isInstructor]);

  // ▶️ START
  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      streamRef.current = stream;

      // 🎥 afficher caméra en direct
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 🎯 format correct audio + vidéo
      const options = { mimeType: 'video/webm; codecs=vp8,opus' };
      const mediaRecorder = MediaRecorder.isTypeSupported(options.mimeType)
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      let chunks = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordingChunks(chunks);
        setPreview(URL.createObjectURL(blob));
        setIsRecording(false);

        // 🧹 arrêter caméra + micro
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // ⏱️ arrêt automatique
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, duration);

    } catch (err) {
      alert("Erreur accès caméra/micro !");
      console.error(err);
    }
  };

  // ⏹️ STOP manuel
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // 📤 UPLOAD
  const uploadRecording = async (isDraft = false) => {
    if (!recordingChunks.length) return alert('Rien à envoyer !');

    const blob = new Blob(recordingChunks, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('studentId', selectedStudent || studentId);
    formData.append('classId', classId);

    try {
      await fetch(isDraft ? '/api/recordings/draft' : '/api/recordings', {
        method: 'POST',
        body: formData,
      });

      alert(isDraft ? 'Brouillon enregistré !' : 'Enregistrement envoyé !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l’envoi !');
    }
  };

  return (
    <div className="p-4">

      {/* 👨‍🎓 SELECT STUDENT */}
      {isInstructor && (
        <div className="mb-4">
          <label className="mr-2 font-semibold">Étudiant :</label>
          <select
            onChange={e => setSelectedStudent(e.target.value)}
            value={selectedStudent}
            className="border p-2 rounded"
          >
            <option value="">-- Choisir --</option>
            {students.map(s => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 🎥 CAMERA LIVE */}
      <div className="mb-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-96 border rounded"
        />
      </div>

      {/* 🎮 BUTTONS */}
      <div className="flex gap-2">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Start
        </button>

        <button
          onClick={stopRecording}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Stop
        </button>
      </div>

      {/* 🎬 PREVIEW */}
      {preview && (
        <div className="mt-4">
          <video
            src={preview}
            controls
            autoPlay
            className="w-96 border rounded"
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => uploadRecording(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Envoyer
            </button>

            <button
              onClick={() => uploadRecording(true)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Brouillon
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveRecording;