import React, { useState, useEffect, useRef } from 'react';

const LiveRecording = ({ classId, studentId, isInstructor }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(studentId || '');
  const [recordingChunks, setRecordingChunks] = useState([]);
  const [preview, setPreview] = useState(null);
  const mediaRecorderRef = useRef(null);

  // Pour l’instructeur : récupérer les étudiants
  useEffect(() => {
    if (isInstructor) {
      fetch(`/api/classes/${classId}/students`)
        .then(res => res.json())
        .then(data => setStudents(data));
    }
  }, [classId, isInstructor]);

  // Démarrer l’enregistrement audio/vidéo
  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        let chunks = [];

        mediaRecorder.ondataavailable = e => chunks.push(e.data);

        mediaRecorder.onstop = () => {
          setRecordingChunks(chunks);
          const blob = new Blob(chunks, { type: 'video/webm' });
          setPreview(URL.createObjectURL(blob));
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 10000); // 10s pour test
      });
  };

  // Envoyer l'enregistrement final
  const uploadRecording = async (isDraft = false) => {
    if (!recordingChunks.length) return alert('Rien à envoyer !');
    const blob = new Blob(recordingChunks, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('studentId', selectedStudent || studentId);
    formData.append('classId', classId);

    await fetch(isDraft ? '/api/recordings/draft' : '/api/recordings', {
      method: 'POST',
      body: formData,
    });
    alert(isDraft ? 'Brouillon enregistré !' : 'Enregistrement envoyé !');
  };

  return (
    <div className="p-4">
      {isInstructor && (
        <select onChange={e => setSelectedStudent(e.target.value)} value={selectedStudent}>
          <option value="">Sélectionner un étudiant</option>
          {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      )}

      <div className="mt-4">
        <button onClick={startRecording}>Démarrer l'enregistrement</button>
      </div>

      {preview && (
        <div className="mt-4">
          <video src={preview} controls width="400" />
          <div className="mt-2">
  <button 
    onClick={() => uploadRecording(false)} 
    style={{ marginRight: '10px', border: '1px solid #007bff', padding: '8px 16px', borderRadius: '4px' }}
  >
    Envoyer
  </button>
  <button 
    onClick={() => uploadRecording(true)} 
    style={{ border: '1px solid #28a745', padding: '8px 16px', borderRadius: '4px' }}
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