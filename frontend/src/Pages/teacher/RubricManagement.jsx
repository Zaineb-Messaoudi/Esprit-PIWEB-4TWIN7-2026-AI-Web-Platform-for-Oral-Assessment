import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Copy, Edit3, Save, X, 
  LayoutList, FileText, CheckCircle2, ChevronRight, Info
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import * as assignmentService from '../../services/assignments.service';

const RubricManagement = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: [{ name: '', description: '', maxScore: 5 }]
  });

  useEffect(() => {
    loadRubrics();
  }, []);

  const loadRubrics = async () => {
    setLoading(true);
    try {
      const data = await assignmentService.getRubrics();
      setRubrics(data || []);
    } catch (err) {
      console.error("Erreur rubriques:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { name: '', description: '', maxScore: 5 }]
    });
  };

  const handleRemoveCriterion = (index) => {
    const newCriteria = formData.criteria.filter((_, i) => i !== index);
    setFormData({ ...formData, criteria: newCriteria });
  };

  const handleCriterionChange = (index, field, value) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index][field] = field === 'maxScore' ? Number(value) : value;
    setFormData({ ...formData, criteria: newCriteria });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentId) {
        await assignmentService.updateRubric(currentId, formData);
      } else {
        await assignmentService.createRubric(formData);
      }
      resetForm();
      loadRubrics();
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', criteria: [{ name: '', description: '', maxScore: 5 }] });
    setIsEditing(false);
    setCurrentId(null);
  };

  const startEdit = (rubric) => {
    setFormData({
      name: rubric.name,
      description: rubric.description,
      criteria: rubric.criteria
    });
    setCurrentId(rubric._id);
    setIsEditing(true);
  };

  // Styles simplifiés pour l'intégration
  const cardBase = isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm';
  const inputBase = isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900';
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="w-full">
      {/* 
         IMPORTANT : Pas de Sidebar, pas de logo ici ! 
         Ce composant sera injecté dans l'Outlet du TeacherDashboard 
      */}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <LayoutList size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Evaluation System</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Rubric Management</h2>
          <p className={mutedText}>Create and organize evaluation criteria for your students.</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg"
          >
            <Plus size={20} /> Create Rubric
          </button>
        )}
      </div>

      {isEditing ? (
        /* --- FORMULAIRE D'EDITION --- */
        <div className={`rounded-3xl border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 ${cardBase}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">{currentId ? 'Edit Rubric' : 'New Rubric'}</h3>
            <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Rubric Name</label>
                <input 
                  className={`w-full rounded-2xl border px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBase}`}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Final Oral Presentation"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Description</label>
                <input 
                  className={`w-full rounded-2xl border px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition ${inputBase}`}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="General context of evaluation"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="font-bold text-lg flex items-center gap-2 text-blue-500">
                  <CheckCircle2 size={20} /> Criteria List
                </h4>
                <button 
                  type="button" 
                  onClick={handleAddCriterion}
                  className="text-sm bg-blue-500/10 text-blue-500 px-4 py-2 rounded-xl font-bold hover:bg-blue-500/20 transition"
                >
                  + Add Criterion
                </button>
              </div>

              <div className="grid gap-4">
                {formData.criteria.map((c, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border group relative ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex flex-col md:flex-row gap-4 mb-3">
                      <input 
                        placeholder="Criterion Name (e.g. Pronunciation)"
                        className={`flex-1 rounded-xl border px-4 py-2 text-sm ${inputBase}`}
                        value={c.name}
                        onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                        required
                      />
                      <div className="relative">
                        <input 
                          type="number"
                          placeholder="Score"
                          className={`w-full md:w-28 rounded-xl border pl-4 pr-8 py-2 text-sm font-bold ${inputBase}`}
                          value={c.maxScore}
                          onChange={e => handleCriterionChange(idx, 'maxScore', e.target.value)}
                          required
                        />
                        <span className="absolute right-3 top-2 text-[10px] font-bold opacity-40 uppercase">pts</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveCriterion(idx)} className="text-red-400 hover:text-red-500 self-center">
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <textarea 
                      placeholder="Describe what is expected for full points..."
                      className={`w-full rounded-xl border px-4 py-2 text-sm ${inputBase}`}
                      value={c.description}
                      onChange={e => handleCriterionChange(idx, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button type="submit" className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-4 font-bold text-white hover:bg-green-700 transition shadow-lg">
                <Save size={20} /> Save Rubric
              </button>
              <button type="button" onClick={resetForm} className={`flex-1 rounded-2xl border px-6 py-4 font-bold transition ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* --- LISTE DES CARTES --- */
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 px-2">
          {loading ? (
            <div className="col-span-full text-center py-20 opacity-50 font-medium tracking-widest">FETCHING RUBRICS...</div>
          ) : rubrics.length === 0 ? (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-white/10 rounded-3xl opacity-40 italic">
              No rubrics found. Create one to start evaluating.
            </div>
          ) : rubrics.map(rubric => (
            <div key={rubric._id} className={`group rounded-3xl border p-6 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 ${cardBase}`}>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => assignmentService.duplicateRubric(rubric._id).then(loadRubrics)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors" title="Duplicate"><Copy size={18}/></button>
                    <button onClick={() => startEdit(rubric)} className="p-2 hover:bg-white/10 rounded-xl text-blue-400 hover:text-blue-300 transition-colors" title="Edit"><Edit3 size={18}/></button>
                    <button onClick={() => { if(window.confirm("Supprimer ?")) assignmentService.deleteRubric(rubric._id).then(loadRubrics) }} className="p-2 hover:bg-white/10 rounded-xl text-red-400 hover:text-red-300 transition-colors" title="Delete"><Trash2 size={18}/></button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{rubric.name}</h3>
                <p className={`text-sm line-clamp-2 mb-4 leading-relaxed ${mutedText}`}>
                  {rubric.description || "No description provided."}
                </p>

                <div className="flex items-center gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    TOTAL: {rubric.criteria?.reduce((sum, c) => sum + (c.maxScore || 0), 0)} PTS
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => startEdit(rubric)}
                className="w-full border-t border-white/5 pt-4 flex justify-between items-center group/btn text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-500" />
                  <span>{rubric.criteria?.length || 0} Criteria</span>
                </div>
                <div className="flex items-center text-blue-500 group-hover/btn:translate-x-1 transition-transform">
                  View Details <ChevronRight size={18} />
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RubricManagement;