// StudentManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Mail, Phone, Calendar, FileText, GraduationCap,
  Edit, Trash2, UserX, UserCheck, Monitor,
  MapPin, Clock, ChevronRight, ArrowLeft, CheckSquare, Square, Zap
} from 'lucide-react';
import SearchBar from '../Components/SearchBar';
import StudentForm from '../Components/StudentForm';
import { useTheme } from '../context/ThemeContect.jsx';

const API = 'http://localhost:3000/api/admin';
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const EVENT_LABELS = {
  login: 'Logged in', login_face: 'Face login', login_oauth: 'OAuth login',
  login_failed: 'Failed login', logout: 'Logged out',
  password_changed: 'Password changed', password_reset: 'Password reset',
  email_verified: 'Email verified', profile_updated: 'Profile updated',
  face_enrolled: 'Face enrolled', account_created: 'Account created',
};
const EVENT_COLORS = {
  login: 'text-green-500 bg-green-500/10', login_face: 'text-green-500 bg-green-500/10',
  login_oauth: 'text-blue-500 bg-blue-500/10', login_failed: 'text-red-500 bg-red-500/10',
  logout: 'text-gray-500 bg-gray-500/10', password_changed: 'text-yellow-500 bg-yellow-500/10',
  password_reset: 'text-orange-500 bg-orange-500/10', email_verified: 'text-teal-500 bg-teal-500/10',
  profile_updated: 'text-purple-500 bg-purple-500/10', face_enrolled: 'text-indigo-500 bg-indigo-500/10',
  account_created: 'text-emerald-500 bg-emerald-500/10',
};

// ─── Detail View ──────────────────────────────────────────────────────────────

const StudentDetail = ({ studentId, onBack, onEdit, onDeactivate, onActivate, onHardDelete, onBan, isDark, loadingId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/students/${studentId}`, { headers: authHeaders() })
      .then(res => setDetail(res.data))
      .catch(e => console.error('Error fetching student detail:', e))
      .finally(() => setLoading(false));
  }, [studentId]);

  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';
  const card = isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200';

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!detail) return (
    <div className="text-center py-32">
      <p className={sub}>Failed to load details.</p>
      <button onClick={onBack} className="mt-4 text-red-500 text-sm hover:underline">Go back</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-medium hover:text-red-500 ${sub}`}>
          <ArrowLeft className="w-4 h-4" /> Back to students
        </button>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onEdit(detail)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'text-blue-400 hover:bg-blue-400/10' : 'text-blue-500 hover:bg-blue-50'}`}>
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          {detail.is_active ? (
            <>
              <button onClick={() => onDeactivate(detail.id)} disabled={loadingId === detail.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${isDark ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-yellow-500 hover:bg-yellow-50'}`}>
                <UserX className="w-3.5 h-3.5" /> Deactivate
              </button>
              <button onClick={() => onBan(detail.id, 24)} disabled={loadingId === detail.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${isDark ? 'text-orange-400 hover:bg-orange-400/10' : 'text-orange-500 hover:bg-orange-50'}`}>
                <Zap className="w-3.5 h-3.5" /> Ban 24h
              </button>
            </>
          ) : (
            <button onClick={() => onActivate(detail.id)} disabled={loadingId === detail.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${isDark ? 'text-green-400 hover:bg-green-400/10' : 'text-green-500 hover:bg-green-50'}`}>
              <UserCheck className="w-3.5 h-3.5" /> Activate
            </button>
          )}
          <button onClick={() => onHardDelete(detail.id)} disabled={loadingId === detail.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50'}`}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border p-6 ${card}`}>
        <div className="flex items-center gap-5 mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-red-500 to-gray-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}>
            {detail.profile_image
              ? <img src={detail.profile_image} alt="" className="w-full h-full object-cover rounded-2xl" />
              : <User className="w-8 h-8 text-white" />}
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {detail.first_name} {detail.last_name}
            </h2>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'}`}>Student</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${detail.is_active
                ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600')
                : (isDark ? 'bg-gray-700 text-gray-400'      : 'bg-gray-200 text-gray-500')}`}>
                {detail.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { icon: Mail,     value: detail.email },
            { icon: Phone,    value: detail.phone_num },
            { icon: FileText, value: detail.cin ? `CIN: ${detail.cin}` : null },
            { icon: Calendar, value: detail.birth_date ? new Date(detail.birth_date).toLocaleDateString() : null },
          ].filter(r => r.value).map(({ icon: Icon, value }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-red-500/15' : 'bg-red-50'}`}>
                <Icon className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              </div>
              <span className={`truncate ${sub}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {detail.profile && (
        <div className={`rounded-2xl border p-6 ${card}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${sub}`}>
            <GraduationCap className="w-4 h-4" /> Academic Profile
          </h3>
          <div className="grid grid-cols-3 gap-6 text-sm">
            {[
              { label: 'Level',    value: detail.profile.level },
              { label: 'Major',    value: detail.profile.major },
              { label: 'Enrolled', value: detail.profile.enrollmentYear },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className={`text-xs mb-1 ${sub}`}>{label}</p>
                <p className={`font-semibold capitalize ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`rounded-2xl border p-6 ${card}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${sub}`}>
          <Clock className="w-4 h-4" /> Activity Log
        </h3>
        {!detail.activity_log?.length
          ? <p className={`text-sm italic ${sub}`}>No activity recorded yet.</p>
          : (
            <div className="space-y-2">
              {detail.activity_log.map((entry, idx) => (
                <div key={idx} className={`flex items-start gap-4 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${EVENT_COLORS[entry.event] ?? 'text-gray-500 bg-gray-500/10'}`}>
                    {EVENT_LABELS[entry.event] ?? entry.event}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {entry.device && <span className={`flex items-center gap-1 ${sub}`}><Monitor className="w-3 h-3" />{entry.device}</span>}
                      {entry.ip     && <span className={`flex items-center gap-1 ${sub}`}><MapPin  className="w-3 h-3" />{entry.ip}</span>}
                    </div>
                    <p className={`text-xs mt-1 ${sub}`}>{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentManagement = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [students,       setStudents]       = useState([]);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [showForm,       setShowForm]       = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loadingId,      setLoadingId]      = useState(null);
  const [selectedId,     setSelectedId]     = useState(null);
  const [selectedBatch,  setSelectedBatch]  = useState([]);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = () => {
    axios.get(`${API}/students`, { headers: authHeaders() })
      .then(res => setStudents(res.data))
      .catch(e => console.error('Error fetching students:', e));
  };

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Pass raw API object — StudentForm handles both snake_case and camelCase
  const handleEdit = (student) => {
    setCurrentStudent(student);
    setShowForm(true);
    setSelectedId(null);
  };

  const handleSubmit = async (payload) => {
    try {
      await axios.put(`${API}/students/${currentStudent.id}`, payload, { headers: authHeaders() });
      fetchStudents();
      setShowForm(false);
      setCurrentStudent(null);
    } catch (e) { console.error(e); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this student?')) return;
    setLoadingId(id);
    try {
      await axios.put(`${API}/users/${id}/deactivate`, {}, { headers: authHeaders() });
      setStudents(prev => prev.map(s => s.id === id ? { ...s, is_active: false } : s));
    } catch (e) { console.error(e); } finally { setLoadingId(null); }
  };

  const handleActivate = async (id) => {
    setLoadingId(id);
    try {
      await axios.put(`${API}/users/${id}/activate`, {}, { headers: authHeaders() });
      setStudents(prev => prev.map(s => s.id === id ? { ...s, is_active: true } : s));
    } catch (e) { console.error(e); } finally { setLoadingId(null); }
  };

  const handleBan = async (id, hours) => {
    setLoadingId(id);
    try {
      await axios.put(`${API}/users/${id}/ban`, { hours }, { headers: authHeaders() });
      setStudents(prev => prev.map(s => s.id === id ? { ...s, is_active: false } : s));
    } catch (e) { console.error(e); } finally { setLoadingId(null); }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('Permanently delete this student?')) return;
    setLoadingId(id);
    try {
      await axios.delete(`${API}/users/${id}`, { headers: authHeaders() });
      setStudents(prev => prev.filter(s => s.id !== id));
      setSelectedId(null);
    } catch (e) { console.error(e); } finally { setLoadingId(null); }
  };

  const handleBulkAction = async (action) => {
    if (!selectedBatch.length) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedBatch.length} students?`)) return;
    try {
      await axios.post(`${API}/users/bulk`, {
        userIds: selectedBatch,
        action,
        duration: action === 'ban' ? 24 : undefined,
      }, { headers: authHeaders() });
      fetchStudents();
      setSelectedBatch([]);
    } catch (e) { console.error(e); }
  };

  const toggleSelect = (id) =>
    setSelectedBatch(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  if (selectedId) return (
    <StudentDetail
      studentId={selectedId} onBack={() => setSelectedId(null)}
      onEdit={handleEdit} onDeactivate={handleDeactivate}
      onActivate={handleActivate} onHardDelete={handleHardDelete}
      onBan={handleBan} isDark={isDark} loadingId={loadingId}
    />
  );

  if (showForm) return (
    <StudentForm
      onSubmit={handleSubmit}
      onCancel={() => { setShowForm(false); setCurrentStudent(null); }}
      mode="edit"
      initialData={currentStudent}
    />
  );

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-lg ${isDark ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-red-400 to-red-600'}`}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-red-400 to-gray-400' : 'bg-gradient-to-r from-red-600 to-gray-700'}`}>
            Student Management
          </h1>
        </div>
        
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="w-full max-w-md">
          <SearchBar onSearch={setSearchTerm} />
        </div>
        {selectedBatch.length > 0 && (
          <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <span className="text-xs font-bold px-2 text-red-500">{selectedBatch.length} selected</span>
            <button onClick={() => handleBulkAction('activate')}   className="p-1.5 hover:bg-green-500/10  text-green-500  rounded-lg" title="Activate"><UserCheck className="w-4 h-4" /></button>
            <button onClick={() => handleBulkAction('deactivate')} className="p-1.5 hover:bg-yellow-500/10 text-yellow-500 rounded-lg" title="Deactivate"><UserX className="w-4 h-4" /></button>
            <button onClick={() => handleBulkAction('delete')}     className="p-1.5 hover:bg-red-500/10    text-red-500    rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
            <button onClick={() => setSelectedBatch([])} className={`text-xs ml-2 px-2 py-1 rounded-md ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length > 0 ? filteredStudents.map(student => (
          <div key={student.id}
            className={`group relative rounded-2xl p-5 border transition-all duration-200 ${!student.is_active ? 'opacity-75' : ''} ${isDark ? 'bg-gray-900/40 border-gray-700 hover:border-red-400/50' : 'bg-white border-gray-200 hover:border-red-300 shadow-sm'}`}>

            <button onClick={() => toggleSelect(student.id)} className="absolute top-4 right-4 z-10 p-1 rounded-md">
              {selectedBatch.includes(student.id)
                ? <CheckSquare className="w-5 h-5 text-red-500" />
                : <Square className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />}
            </button>

            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedId(student.id)}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-red-500 to-gray-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}>
                {student.profile_image
                  ? <img src={student.profile_image} alt="" className="w-full h-full object-cover rounded-xl" />
                  : <User className="w-5 h-5 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold text-sm truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{student.first_name} {student.last_name}</p>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{student.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 mr-6" />
            </div>

            <div className="flex gap-1.5 mt-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'}`}>Student</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${student.is_active
                ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600')
                : (isDark ? 'bg-gray-700 text-gray-400'      : 'bg-gray-200 text-gray-500')}`}>
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex gap-1 mt-3 pt-3 border-t border-dashed border-gray-200/50">
              <button onClick={() => handleEdit(student)} title="Edit" className={`p-1.5 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-400/10' : 'text-blue-500 hover:bg-blue-50'}`}><Edit className="w-3.5 h-3.5" /></button>
              {student.is_active ? (
                <>
                  <button onClick={() => handleDeactivate(student.id)} title="Deactivate" className={`p-1.5 rounded-lg ${isDark ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-yellow-500 hover:bg-yellow-50'}`}><UserX className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleBan(student.id, 24)}    title="Ban 24h"    className={`p-1.5 rounded-lg ${isDark ? 'text-orange-400 hover:bg-orange-400/10' : 'text-orange-500 hover:bg-orange-50'}`}><Zap className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <button onClick={() => handleActivate(student.id)} title="Activate" className={`p-1.5 rounded-lg ${isDark ? 'text-green-400 hover:bg-green-400/10' : 'text-green-500 hover:bg-green-50'}`}><UserCheck className="w-3.5 h-3.5" /></button>
              )}
              <button onClick={() => handleHardDelete(student.id)} title="Delete" className={`p-1.5 rounded-lg ${isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50'}`}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-16">
            <GraduationCap className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No students found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;