import React, { useState, useEffect } from 'react';
import { Upload, FileAudio, FileVideo, Send, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  getAssignmentsByClass,
  uploadDraft,
  getDraft,
  submitDraft,
  deleteDraft,
} from '../../services/assignments.service';

const Assignments = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [assignments, setAssignments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Récupère le classId depuis localStorage (à adapter selon ton auth)
  const classId = "69c992a61582c4952fc51db2";

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await getAssignmentsByClass(classId);
      setAssignments(data);

      // Charger les brouillons pour chaque devoir
      const draftsMap = {};
      await Promise.all(
        data.map(async (a) => {
          try {
            const draft = await getDraft(a._id);
            if (draft) draftsMap[a._id] = draft;
          } catch {}
        })
      );
      setDrafts(draftsMap);
    } catch (err) {
      setError('Erreur lors du chargement des devoirs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (assignment, file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const audioExts = ['mp3', 'wav'];
    const videoExts = ['mp4', 'avi', 'mov'];
    const isAudio = audioExts.includes(ext);
    const isVideo = videoExts.includes(ext);

    if (!isAudio && !isVideo) {
      setError('Format non supporté. Utilisez MP3, WAV, MP4, AVI ou MOV');
      return;
    }

    const allowedType = assignment.allowedFileTypes;
    if (allowedType === 'audio' && !isAudio) return setError('Seuls les fichiers audio sont acceptés');
    if (allowedType === 'video' && !isVideo) return setError('Seuls les fichiers vidéo sont acceptés');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', assignment.classId);
    formData.append('assignmentId', assignment._id);
    formData.append('fileType', isAudio ? 'audio' : 'video');

    try {
      setUploading(prev => ({ ...prev, [assignment._id]: true }));
      const draft = await uploadDraft(formData);
      setDrafts(prev => ({ ...prev, [assignment._id]: draft }));
      setSuccess('Brouillon sauvegardé !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(prev => ({ ...prev, [assignment._id]: false }));
    }
  };

  const handleSubmit = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await submitDraft(draft._id);
      setDrafts(prev => ({
        ...prev,
        [assignmentId]: { ...prev[assignmentId], isDraft: false }
      }));
      setSuccess('Devoir soumis avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    }
  };

  const handleDelete = async (assignmentId) => {
    const draft = drafts[assignmentId];
    if (!draft) return;
    try {
      await deleteDraft(draft._id);
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[assignmentId];
        return updated;
      });
      setSuccess('Brouillon supprimé');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const isDeadlinePassed = (deadline) => new Date() > new Date(deadline);

  const getStatusBadge = (assignment) => {
    const draft = drafts[assignment._id];
    if (!draft) return { label: 'Non commencé', color: 'gray', icon: Clock };
    if (!draft.isDraft) return { label: 'Soumis', color: 'green', icon: CheckCircle };
    return { label: 'Brouillon', color: 'yellow', icon: AlertCircle };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Mes Devoirs
        </h2>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Uploadez vos fichiers audio/vidéo avant la date limite
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Liste des devoirs */}
      {assignments.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <FileAudio size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucun devoir disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const draft = drafts[assignment._id];
            const passed = isDeadlinePassed(assignment.deadline);
            const status = getStatusBadge(assignment);
            const StatusIcon = status.icon;
            const isUploading = uploading[assignment._id];

            return (
              <div key={assignment._id} className={`rounded-xl border p-6 transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white border-gray-200 hover:shadow-md'
              }`}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {assignment.title}
                    </h3>
                    {assignment.description && (
                      <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {assignment.description}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`ml-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    status.color === 'green' ? 'bg-green-100 text-green-700' :
                    status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                {/* Info row */}
                <div className={`flex items-center gap-4 text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Date limite : {new Date(assignment.deadline).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    passed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {passed ? '⛔ Fermé' : '✅ Ouvert'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {assignment.allowedFileTypes === 'audio' ? '🎵 Audio uniquement' :
                     assignment.allowedFileTypes === 'video' ? '🎬 Vidéo uniquement' : '🎵🎬 Audio & Vidéo'}
                  </span>
                </div>

                {/* Draft info */}
                {draft && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
                    isDark ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    {draft.fileType === 'audio' ? <FileAudio size={20} className="text-blue-500" /> : <FileVideo size={20} className="text-purple-500" />}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Fichier uploadé
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {draft.fileSize ? `${(draft.fileSize / 1024 / 1024).toFixed(2)} MB` : ''} •
                        {draft.isDraft ? ' Brouillon' : ' Soumis définitivement'}
                      </p>
                    </div>
                    {draft.fileUrl && (
                      
                        <a href={"http://localhost:3000" + draft.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Eye size={18} />
                      </a>
                    )}
                  </div>
                )}

                {/* Actions */}
                {!passed && draft?.isDraft !== false && (
                  <div className="flex flex-wrap gap-3">
                    {/* Upload */}
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all font-medium text-sm ${
                      isUploading ? 'opacity-50 cursor-not-allowed' :
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}>
                      <Upload size={16} />
                      {isUploading ? 'Upload...' : draft ? 'Remplacer' : 'Uploader'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".mp3,.wav,.mp4,.avi,.mov"
                        disabled={isUploading}
                        onChange={(e) => handleFileUpload(assignment, e.target.files[0])}
                      />
                    </label>

                    {/* Soumettre */}
                    {draft && draft.isDraft && (
                      <button
                        onClick={() => handleSubmit(assignment._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm transition-all"
                      >
                        <Send size={16} />
                        Soumettre
                      </button>
                    )}

                    {/* Supprimer */}
                    {draft && draft.isDraft && (
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}

                {/* Soumis */}
                {draft && !draft.isDraft && (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle size={18} />
                    Soumis le {new Date(draft.submittedAt).toLocaleDateString('fr-FR')}
                  </div>
                )}

                {/* Deadline passée */}
                {passed && !draft && (
                  <p className="text-red-500 text-sm font-medium">
                    ⛔ La date limite est passée — aucun fichier soumis
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Assignments;