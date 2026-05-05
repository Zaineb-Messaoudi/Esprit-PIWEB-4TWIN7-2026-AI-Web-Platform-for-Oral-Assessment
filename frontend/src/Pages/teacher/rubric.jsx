import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit, Copy, ChevronDown, ChevronUp,
  CheckCircle, AlertCircle, X, Save,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContect.jsx';
import {
  getRubrics, createRubric, updateRubric, deleteRubric,
  addCriterion, removeCriterion, duplicateRubric,
} from '../../services/assignments.service';

const Rubrics = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [rubrics,     setRubrics]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [expanded,    setExpanded]    = useState({});
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);

  const emptyForm = { name: '', description: '', criteria: [] };
  const [form, setForm] = useState(emptyForm);

  const emptyCriterion = { name: '', maxScore: 0, description: '' };
  const [newCriterion, setNewCriterion] = useState(emptyCriterion);
  const [addingCriterionTo, setAddingCriterionTo] = useState(null);

  const showOk  = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };
  const showErr = (msg) => { setError(msg);   setTimeout(() => setError(null),   4000); };

  const fetchRubrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRubrics();
      setRubrics(data);
    } catch {
      showErr('Failed to load rubrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRubrics();
  }, [fetchRubrics]);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const getTotalScore = (criteria) =>
    criteria.reduce((s, c) => s + Number(c.maxScore || 0), 0);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (rubric) => {
    setEditTarget(rubric);
    setForm({
      name:        rubric.name,
      description: rubric.description || '',
      criteria:    rubric.criteria.map((c) => ({ ...c })),
    });
    setShowForm(true);
  };

  const handleAddCriterionInForm = () => {
    if (!form.name.trim()) return;
    setForm((prev) => ({
      ...prev,
      criteria: [
        ...prev.criteria,
        { key: crypto.randomUUID(), name: '', maxScore: 0, description: '' },
      ],
    }));
  };

  const handleRemoveCriterionInForm = (index) => {
    setForm((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const handleCriterionChangeInForm = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.criteria];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, criteria: updated };
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        await updateRubric(editTarget._id, {
            name: form.name,
            description: form.description,
            criteria: form.criteria.map(c => ({
                key: c.key,
                name: c.name,
                description: c.description,
                maxScore: c.maxScore
            })),
            });
        showOk('Rubric updated!');
      } else {
        await createRubric({
  ...form,
  criteria: form.criteria.map(c => ({
    key: c.key,
    name: c.name,
    description: c.description,
    maxScore: c.maxScore
  }))
});
        showOk('Rubric created!');
      }
      setShowForm(false);
      setEditTarget(null);
      setForm(emptyForm);
      fetchRubrics();
    } catch (err) {
      showErr((err.response && err.response.data && err.response.data.message) || 'Error saving rubric');
    }
  };

  const handleDelete = async (rubric) => {
    if (!window.confirm('Delete rubric "' + rubric.name + '"?')) return;
    try {
      await deleteRubric(rubric._id);
      showOk('Rubric deleted');
      fetchRubrics();
    } catch {
      showErr('Failed to delete rubric');
    }
  };

  const handleDuplicate = async (rubric) => {
    try {
      await duplicateRubric(rubric._id);
      showOk('Rubric duplicated!');
      fetchRubrics();
    } catch {
      showErr('Failed to duplicate rubric');
    }
  };

  const handleAddCriterion = async (rubricId) => {
    if (!newCriterion.name.trim()) return;
    try {
      await addCriterion(rubricId, newCriterion);
      showOk('Criterion added!');
      setAddingCriterionTo(null);
      setNewCriterion(emptyCriterion);
      fetchRubrics();
    } catch {
      showErr('Failed to add criterion');
    }
  };

  const handleRemoveCriterion = async (rubricId, index) => {
    try {
      await removeCriterion(rubricId, index);
      showOk('Criterion removed');
      fetchRubrics();
    } catch {
      showErr('Failed to remove criterion');
    }
  };

  const inputCls = [
    'w-full px-3 py-2 rounded-lg border text-sm',
    isDark
      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
  ].join(' ');

  const labelCls = ['block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700'].join(' ');

  const cardCls = [
    'rounded-xl border transition-all',
    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200',
  ].join(' ');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={isDark ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-gray-900'}>
            Rubrics
          </h2>
          <p className={isDark ? 'mt-1 text-gray-400' : 'mt-1 text-gray-600'}>
            Create and manage evaluation rubrics with dynamic criteria.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
        >
          <Plus size={18} />
          New rubric
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-auto">x</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className={cardCls + ' p-6'}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={isDark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900'}>
              {editTarget ? 'Edit Rubric' : 'Create Rubric'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditTarget(null); }}>
              <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input
                type="text" required value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls} placeholder="e.g. Oral Presentation Rubric"
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={2} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={inputCls + ' resize-none'}
                placeholder="Optional description..."
              />
            </div>

            {/* Criteria in form */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>
                  Criteria ({form.criteria.length}) — Total: {getTotalScore(form.criteria)} pts
                </label>
                <button
                  type="button"
                  onClick={handleAddCriterionInForm}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  <Plus size={14} /> Add criterion
                </button>
              </div>

              {form.criteria.length === 0 && (
                <p className={isDark ? 'text-sm text-gray-500 italic' : 'text-sm text-gray-400 italic'}>
                  No criteria yet. Click "Add criterion" to start.
                </p>
              )}

              <div className="space-y-3">
                {form.criteria.map((c, i) => (
                  <div key={i} className={[
                    'p-3 rounded-lg border',
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200',
                  ].join(' ')}>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="text" placeholder="Criterion name" required
                        value={c.name}
                        onChange={(e) => handleCriterionChangeInForm(i, 'name', e.target.value)}
                        className={inputCls + ' col-span-2'}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number" placeholder="Max" min={0} required
                          value={c.maxScore}
                          onChange={(e) => handleCriterionChangeInForm(i, 'maxScore', e.target.value)}
                          className={inputCls}
                        />
                        <span className={isDark ? 'text-gray-400 text-xs whitespace-nowrap' : 'text-gray-500 text-xs whitespace-nowrap'}>pts</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text" placeholder="Description (optional)"
                        value={c.description || ''}
                        onChange={(e) => handleCriterionChangeInForm(i, 'description', e.target.value)}
                        className={inputCls + ' flex-1'}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterionInForm(i)}
                        className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all">
                <Save size={16} />
                {editTarget ? 'Save changes' : 'Create'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setEditTarget(null); }}
                className={[
                  'px-6 py-2 rounded-lg font-medium transition-all',
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ].join(' ')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rubrics list */}
      {rubrics.length === 0 ? (
        <div className={[
          'text-center py-16 rounded-xl border',
          isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500',
        ].join(' ')}>
          <Plus size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No rubrics yet</p>
          <p className="text-sm mt-1">Click "New rubric" to create your first one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rubrics.map((rubric) => {
            const isExpanded = expanded[rubric._id];
            const total = getTotalScore(rubric.criteria);
            const isAddingHere = addingCriterionTo === rubric._id;

            return (
              <div key={rubric._id} className={cardCls}>

                {/* Rubric header */}
                <div className="p-5 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={isDark ? 'text-lg font-bold text-white' : 'text-lg font-bold text-gray-900'}>
                      {rubric.name}
                    </h3>
                    {rubric.description && (
                      <p className={isDark ? 'text-sm text-gray-400 mt-0.5' : 'text-sm text-gray-500 mt-0.5'}>
                        {rubric.description}
                      </p>
                    )}
                    <div className={[
                      'flex items-center gap-3 mt-2 text-xs',
                      isDark ? 'text-gray-400' : 'text-gray-500',
                    ].join(' ')}>
                      <span className={[
                        'px-2 py-0.5 rounded font-medium',
                        isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600',
                      ].join(' ')}>
                        {rubric.criteria.length} criteria
                      </span>
                      <span className={[
                        'px-2 py-0.5 rounded font-medium',
                        isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
                      ].join(' ')}>
                        {total} pts total
                      </span>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                        {new Date(rubric.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => openEdit(rubric)} title="Edit"
                      className={[
                        'p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600',
                      ].join(' ')}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDuplicate(rubric)} title="Duplicate"
                      className={[
                        'p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600',
                      ].join(' ')}>
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDelete(rubric)} title="Delete"
                      className={[
                        'p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500',
                      ].join(' ')}>
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => toggleExpand(rubric._id)}
                      className={[
                        'p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600',
                      ].join(' ')}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Criteria list */}
                {isExpanded && (
                  <div className={[
                    'border-t px-5 py-4 space-y-3',
                    isDark ? 'border-white/10' : 'border-gray-200',
                  ].join(' ')}>

                    {rubric.criteria.length === 0 ? (
                      <p className={isDark ? 'text-sm text-gray-500 italic' : 'text-sm text-gray-400 italic'}>
                        No criteria yet.
                      </p>
                    ) : (
                      rubric.criteria.map((criterion, index) => (
                        <div key={criterion._id || index} className={[
                          'flex items-center justify-between p-3 rounded-lg',
                          isDark ? 'bg-white/5' : 'bg-gray-50',
                        ].join(' ')}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={isDark ? 'font-medium text-white text-sm' : 'font-medium text-gray-900 text-sm'}>
                                {criterion.name}
                              </span>
                              <span className={[
                                'px-2 py-0.5 rounded text-xs font-bold',
                                isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
                              ].join(' ')}>
                                {criterion.maxScore} pts
                              </span>
                            </div>
                            {criterion.description && (
                              <p className={isDark ? 'text-xs text-gray-400 mt-0.5' : 'text-xs text-gray-500 mt-0.5'}>
                                {criterion.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveCriterion(rubric._id, index)}
                            className={[
                              'p-1.5 rounded transition-colors ml-2',
                              isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500',
                            ].join(' ')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Add criterion inline */}
                    {isAddingHere ? (
                      <div className={[
                        'p-3 rounded-lg border',
                        isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200',
                      ].join(' ')}>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            type="text" placeholder="Criterion name"
                            value={newCriterion.name}
                            onChange={(e) => setNewCriterion((p) => ({ ...p, name: e.target.value }))}
                            className={inputCls + ' col-span-2'}
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number" placeholder="Max" min={0}
                              value={newCriterion.maxScore}
                              onChange={(e) => setNewCriterion((p) => ({ ...p, maxScore: Number(e.target.value) }))}
                              className={inputCls}
                            />
                            <span className={isDark ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs'}>pts</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text" placeholder="Description (optional)"
                            value={newCriterion.description}
                            onChange={(e) => setNewCriterion((p) => ({ ...p, description: e.target.value }))}
                            className={inputCls + ' flex-1'}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCriterion(rubric._id)}
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAddingCriterionTo(null); setNewCriterion(emptyCriterion); }}
                            className={[
                              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                              isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                            ].join(' ')}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingCriterionTo(rubric._id); setNewCriterion(emptyCriterion); }}
                        className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium"
                      >
                        <Plus size={14} /> Add criterion
                      </button>
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

export default Rubrics;