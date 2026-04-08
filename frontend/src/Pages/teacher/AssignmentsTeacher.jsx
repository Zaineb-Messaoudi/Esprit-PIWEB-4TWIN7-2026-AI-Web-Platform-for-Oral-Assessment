import React, { useState, useEffect } from 'react';
import { Plus, Eye, Users, Clock, CheckCircle, AlertCircle, FileAudio, FileVideo, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  createAssignment,
  getAssignmentsByClass,
  getSubmissionsByAssignment,
} from '../../services/assignments.service';

const AssignmentsTeacher = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const classId = "69c992a61582c4952fc51db2";

  const [form, setForm] = useState({
    classId: "69c992a61582c4952fc51db2",
    title: '',
    description: '',
    allowedFileTypes: 'both',
    deadline: '',
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await getAssignmentsByClass(classId);
      setAssignments(data);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAssignment(form);
      setSuccess('Devoir créé avec succès !');
      setShowForm(false);
      setForm({ classId, title: '', description: '', allowedFileTypes: 'both', deadline: '' });
      fetchAssignments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const data = await getSubmissionsByAssignment(assignment._id);
      setSubmissions(prev => ({ ...prev, [assignment._id]: data }));
    } catch {
      setError('Erreur lors du chargement des soumissions');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestion des Devoirs
          </h2>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Créez et gérez les devoirs audio/vidéo
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
        >
          <Plus size={18} />
          Nouveau devoir
        </button>
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

      {/* Formulaire création */}
      {showForm && (
        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Créer un devoir
            </h3>
            <button onClick={() => setShowForm(false)}>
              <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Titre *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Ex: Présentation orale chapitre 3"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Instructions pour les étudiants..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Type de fichier autorisé *
                </label>
                <select
                  value={form.allowedFileTypes}
                  onChange={e => setForm(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="both">Audio & Vidéo</option>
                  <option value="audio">Audio uniquement</option>
                  <option value="video">Vidéo uniquement</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date limite *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.deadline}
                  onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
              >
                Créer le devoir
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des devoirs */}
      {assignments.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <Plus size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucun devoir créé</p>
          <p className="text-sm mt-1">Cliquez sur "Nouveau devoir" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const subs = submissions[assignment._id] || [];
            const isSelected = selectedAssignment?._id === assignment._id;
            const passed = new Date() > new Date(assignment.deadline);

            return (
              <div key={assignment._id} className={`rounded-xl border transition-all ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              }`}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {assignment.title}
                      </h3>
                      {assignment.description && (
                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {assignment.description}
                        </p>
                      )}
                      <div className={`flex items-center gap-4 mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(assignment.deadline).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          passed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {passed ? '⛔ Fermé' : '✅ Ouvert'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {assignment.allowedFileTypes === 'audio' ? '🎵 Audio' :
                           assignment.allowedFileTypes === 'video' ? '🎬 Vidéo' : '🎵🎬 Les deux'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => isSelected ? setSelectedAssignment(null) : handleViewSubmissions(assignment)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        isSelected
                          ? 'bg-red-500 text-white'
                          : isDark
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Users size={16} />
                      Soumissions
                    </button>
                  </div>
                </div>

                {/* Soumissions */}
                {isSelected && (
                  <div className={`border-t px-6 py-4 ${
                    isDark ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Soumissions ({subs.length})
                    </h4>
                    {subs.length === 0 ? (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Aucune soumission pour ce devoir
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {subs.map((sub) => (
                          <div key={sub._id} className={`flex items-center justify-between p-3 rounded-lg ${
                            isDark ? 'bg-white/5' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-3">
                              {sub.fileType === 'audio'
                                ? <FileAudio size={18} className="text-blue-500" />
                                : <FileVideo size={18} className="text-purple-500" />
                              }
                              <div>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {sub.studentId?.firstName} {sub.studentId?.lastName}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {sub.studentId?.email} •
                                  Soumis le {new Date(sub.submittedAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            {sub.fileUrl && (
                              
                                <a href={"http://localhost:3000" + draft.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-all"
                              >
                                <Eye size={14} />
                                Voir
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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

export default AssignmentsTeacher;