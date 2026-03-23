import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Mail, Phone, Calendar, FileText, GraduationCap,
  Edit, Trash2, UserX, UserCheck, Plus, Shield, Monitor,
  MapPin, Clock, ChevronRight, ArrowLeft, BookOpen
} from 'lucide-react';
import TeacherForm from '../Components/TeacherForm';
import SearchBar from '../Components/SearchBar';
import { useTheme } from '../context/ThemeContect.jsx';

const API = 'http://127.0.0.1:3000/api/admin';

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
  login: 'text-green-500 bg-green-500/10',
  login_face: 'text-green-500 bg-green-500/10',
  login_oauth: 'text-blue-500 bg-blue-500/10',
  login_failed: 'text-red-500 bg-red-500/10',
  logout: 'text-gray-500 bg-gray-500/10',
  password_changed: 'text-yellow-500 bg-yellow-500/10',
  password_reset: 'text-orange-500 bg-orange-500/10',
  email_verified: 'text-teal-500 bg-teal-500/10',
  profile_updated: 'text-purple-500 bg-purple-500/10',
  face_enrolled: 'text-indigo-500 bg-indigo-500/10',
  account_created: 'text-emerald-500 bg-emerald-500/10',
};

// ─── Detail View ──────────────────────────────────────────────────────────────

const TeacherDetail = ({ teacherId, onBack, onEdit, onDeactivate, onActivate, onHardDelete, isDark, loadingId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/teachers/${teacherId}`, { headers: authHeaders() })
      .then(res => {
        setDetail(res.data);
        setLoading(false);
      })
      .catch(e => {
        console.error('Error fetching teacher detail:', e);
        setLoading(false);
      });
  }, [teacherId]);

  const sub = isDark ? 'text-gray-400' : 'text-gray-500';
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
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack}
          className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-red-500 ${sub}`}>
          <ArrowLeft className="w-4 h-4" /> Back to teachers
        </button>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onEdit(detail)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-400/10' : 'text-blue-500 hover:bg-blue-50'}`}>
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          {detail.is_active ? (
            <button onClick={() => onDeactivate(detail.id)} disabled={loadingId === detail.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-yellow-500 hover:bg-yellow-50'}`}>
              <UserX className="w-3.5 h-3.5" /> Deactivate
            </button>
          ) : (
            <button onClick={() => onActivate(detail.id)} disabled={loadingId === detail.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? 'text-green-400 hover:bg-green-400/10' : 'text-green-500 hover:bg-green-50'}`}>
              <UserCheck className="w-3.5 h-3.5" /> Activate
            </button>
          )}
          <button onClick={() => onHardDelete(detail.id)} disabled={loadingId === detail.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50'}`}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Identity */}
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
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'}`}>Teacher</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${detail.is_active
                ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600')
                : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')}`}>
                {detail.is_active ? 'Active' : 'Inactive'}
              </span>
              {detail.is_email_verified && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  Email verified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { icon: Mail, value: detail.email },
            { icon: Phone, value: detail.phone_num },
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

      {/* Instructor profile */}
      {detail.profile && (
        <div className={`rounded-2xl border p-6 ${card}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${sub}`}>
            <BookOpen className="w-4 h-4" /> Instructor Profile
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className={`text-xs mb-1 ${sub}`}>Department</p>
              <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{detail.profile.department}</p>
            </div>
            {detail.profile.bio && (
              <div>
                <p className={`text-xs mb-1 ${sub}`}>Bio</p>
                <p className={`leading-relaxed ${sub}`}>{detail.profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OAuth */}
      {detail.oauth_providers?.length > 0 && (
        <div className={`rounded-2xl border p-6 ${card}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${sub}`}>
            <Shield className="w-4 h-4" /> Connected Providers
          </h3>
          <div className="flex gap-2 flex-wrap">
            {detail.oauth_providers.map(p => (
              <span key={p} className={`text-sm px-3 py-1 rounded-full font-medium capitalize ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className={`rounded-2xl border p-6 ${card}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${sub}`}>
          <Clock className="w-4 h-4" /> Activity Log
        </h3>
        {!detail.activity_log?.length ? (
          <p className={`text-sm italic ${sub}`}>No activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {detail.activity_log.map((entry, idx) => (
              <div key={idx} className={`flex items-start gap-4 p-3 rounded-xl border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-100'}`}>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${EVENT_COLORS[entry.event] ?? 'text-gray-500 bg-gray-500/10'}`}>
                  {EVENT_LABELS[entry.event] ?? entry.event}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {entry.device && <span className={`flex items-center gap-1 ${sub}`}><Monitor className="w-3 h-3" />{entry.device}</span>}
                    {entry.ip && <span className={`flex items-center gap-1 ${sub}`}><MapPin className="w-3 h-3" />{entry.ip}</span>}
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

const TeacherManagement = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    axios.get(`${API}/teachers`, { headers: authHeaders() })
      .then(res => setTeachers(res.data))
      .catch(e => console.error('Error fetching teachers:', e));
  }, []);

  const filteredTeachers = teachers.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (teacher) => { setCurrentTeacher(teacher); setShowForm(true); setSelectedId(null); };
  const handleCancel = () => { setShowForm(false); setCurrentTeacher(null); };

  const handleSubmit = async (teacherData) => {
    try {
      if (currentTeacher) {
        const res = await axios.put(`${API}/teachers/${currentTeacher.id}`, teacherData, { headers: authHeaders() });
        setTeachers(prev => prev.map(t => t.id === currentTeacher.id ? { ...t, ...res.data } : t));
      } else {
        const res = await axios.post(`${API}/teachers`, teacherData, { headers: authHeaders() });
        setTeachers(prev => [...prev, res.data]);
      }
      setShowForm(false);
      setCurrentTeacher(null);
    } catch (e) {
      console.error('Error saving teacher:', e.response?.data || e.message);
      alert(`Failed to ${currentTeacher ? 'update' : 'create'} teacher.`);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this teacher?')) return;
    setLoadingId(id);
    try {
      await axios.delete(`${API}/teachers/${id}/deactivate`, { headers: authHeaders() });
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, is_active: false } : t));
      setSelectedId(null);
    } catch (e) { console.error(e); } finally { setLoadingId(null); }
  };

  const handleActivate = async (id) => {
    setLoadingId(id);
    try {
      await axios.put(`${API}/teachers/${id}/activate`, {}, { headers: authHeaders() });
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, is_active: true } : t));
    } catch (e) { console.error(e); } finally { setLoadingId(null); }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('Permanently delete this teacher? Cannot be undone.')) return;
    setLoadingId(id);
    try {
      await axios.delete(`${API}/teachers/${id}/delete`, { headers: authHeaders() });
      setTeachers(prev => prev.filter(t => t.id !== id));
      setSelectedId(null);
    } catch (e) { console.error(e.response?.data || e.message); alert('Failed to delete teacher.'); }
    finally { setLoadingId(null); }
  };

  // ── Render: detail view ──
  if (selectedId) return (
    <TeacherDetail
      teacherId={selectedId}
      onBack={() => setSelectedId(null)}
      onEdit={handleEdit}
      onDeactivate={handleDeactivate}
      onActivate={handleActivate}
      onHardDelete={handleHardDelete}
      isDark={isDark}
      loadingId={loadingId}
    />
  );

  // ── Render: form ──
  if (showForm) return (
    <TeacherForm onSubmit={handleSubmit} onCancel={handleCancel} mode={currentTeacher ? 'edit' : 'add'} initialData={currentTeacher} />
  );

  // ── Render: list ──
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-lg ${isDark ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-red-400 to-red-600'}`}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-red-400 to-gray-400' : 'bg-gradient-to-r from-red-600 to-gray-700'}`}>
            Teacher Management
          </h1>
        </div>
       
      </div>

      <div className="max-w-md mx-auto">
        <SearchBar onSearch={t => setSearchTerm(t)} />
      </div>

      <div className="text-center">
        <button onClick={() => setShowForm(true)}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg ${isDark ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
          <Plus className="w-4 h-4" /> Add New Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
          <div key={teacher.id} onClick={() => setSelectedId(teacher.id)}
            className={`group relative rounded-2xl p-5 border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${!teacher.is_active ? 'opacity-60' : ''} ${isDark ? 'bg-gray-900/40 border-gray-700 hover:border-red-400/50' : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-red-100/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gradient-to-br from-red-500 to-gray-600' : 'bg-gradient-to-br from-red-400 to-red-600'}`}>
                {teacher.profile_image ? <img src={teacher.profile_image} alt="" className="w-full h-full object-cover rounded-xl" /> : <User className="w-5 h-5 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold text-sm truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{teacher.first_name} {teacher.last_name}</p>
                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{teacher.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
            </div>
            <div className="flex gap-1.5 mt-3 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'}`}>Teacher</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${teacher.is_active ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600') : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')}`}>
                {teacher.is_active ? 'Active' : 'Inactive'}
              </span>
              {teacher.fields?.[0] && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{teacher.fields[0]}</span>
              )}
            </div>
            <div className="flex gap-1 mt-3 pt-3 border-t border-dashed border-gray-200/50" onClick={e => e.stopPropagation()}>
              <button onClick={() => handleEdit(teacher)} disabled={loadingId === teacher.id} title="Edit"
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'text-blue-400 hover:bg-blue-400/10' : 'text-blue-500 hover:bg-blue-50'}`}><Edit className="w-3.5 h-3.5" /></button>
              {teacher.is_active
                ? <button onClick={() => handleDeactivate(teacher.id)} disabled={loadingId === teacher.id} title="Deactivate"
                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-yellow-500 hover:bg-yellow-50'}`}><UserX className="w-3.5 h-3.5" /></button>
                : <button onClick={() => handleActivate(teacher.id)} disabled={loadingId === teacher.id} title="Activate"
                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'text-green-400 hover:bg-green-400/10' : 'text-green-500 hover:bg-green-50'}`}><UserCheck className="w-3.5 h-3.5" /></button>}
              <button onClick={() => handleHardDelete(teacher.id)} disabled={loadingId === teacher.id} title="Delete permanently"
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50'}`}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-16">
            <GraduationCap className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No teachers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;