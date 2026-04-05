import React, { useState, useEffect, useRef } from 'react';

const LiveRecording = ({ classId, studentId, isInstructor, duration = 10000 }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(studentId || '');
  const [recordingChunks, setRecordingChunks] = useState([]);
  const [preview, setPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isInstructor) {
      fetch(`/api/classes/${classId}/students`)
        .then(res => res.json())
        .then(data => setStudents(data || []))
        .catch(err => console.error("Erreur fetch students:", err));
    }
  }, [classId, isInstructor]);

  // Démarrer l’enregistrement avec arrêt automatique
  const startRecording = async () => {
    if (isRecording) return; // éviter double clic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      let chunks = [];

      mediaRecorder.ondataavailable = e => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        setRecordingChunks(chunks);
        const blob = new Blob(chunks, { type: 'video/webm' });
        setPreview(URL.createObjectURL(blob));
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Arrêt automatique après `duration` ms
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      }, duration);

    } catch (err) {
      alert("Impossible d'accéder au micro ou à la caméra !");
      console.error(err);
    }
  };

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
      {isInstructor && (
        <div className="mb-4">
          <label className="mr-2 font-semibold">Sélectionner un étudiant :</label>
          <select
            onChange={e => setSelectedStudent(e.target.value)}
            value={selectedStudent}
            className="border p-2 rounded"
          >
            <option value="">-- Choisir un étudiant --</option>
            {students.length > 0 ? (
              students.map(s => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name || "Nom inconnu"}
                </option>
              ))
            ) : (
              <option disabled>Aucun étudiant disponible</option>
            )}
          </select>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={startRecording}
          className={`px-4 py-2 rounded ${isRecording ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'}`}
          disabled={isRecording}
        >
          {isRecording ? 'Enregistrement en cours...' : 'Démarrer l\'enregistrement'}
        </button>
      </div>

      {preview && (
        <div className="mt-4">
          <video src={preview} controls width="400" className="border rounded" />
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
              Garder en brouillon
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRecording;