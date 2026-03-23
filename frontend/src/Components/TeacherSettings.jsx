import { useState, useCallback, memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Shield, User, Bell, Palette, Globe, Lock,
  Eye, EyeOff, Check, X, Settings, Save, RefreshCw,
  Mail, Phone, Calendar, BadgeCheck, Pencil,
  BookOpen, ShieldCheck, GraduationCap, Camera, AtSign,
  AlertCircle, Loader, LogIn, KeyRound, UserCheck, AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';
import { useFaceValidation } from '../hooks/useFaceValidation';

// ─── Utilities ────────────────────────────────────────────────────────────────

const checkPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return strength;
};

const getPasswordStrengthColor = (strength) => {
  switch (strength) {
    case 0: case 1: return 'bg-red-500';
    case 2: return 'bg-orange-500';
    case 3: return 'bg-yellow-500';
    case 4: return 'bg-blue-500';
    case 5: return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getPasswordStrengthText = (strength) => {
  switch (strength) {
    case 0: case 1: return 'Very Weak';
    case 2: return 'Weak';
    case 3: return 'Fair';
    case 4: return 'Good';
    case 5: return 'Strong';
    default: return '';
  }
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

const initials = (first = '', last = '') =>
  `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '??';

const ROLE_META = {
  student:    { label: 'Student',    Icon: GraduationCap, color: 'text-blue-400',  bg: 'bg-blue-500/10  border-blue-500/30'  },
  instructor: { label: 'Instructor', Icon: BookOpen,       color: 'text-red-400',   bg: 'bg-red-500/10   border-red-500/30'   },
  admin:      { label: 'Admin',      Icon: ShieldCheck,    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
};

// ─── Activity log helpers ─────────────────────────────────────────────────────

const EVENT_META = {
  login:            { label: 'Signed in',              Icon: LogIn,         color: 'text-green-400',  dot: 'bg-green-400'  },
  login_face:       { label: 'Signed in with Face ID', Icon: Camera,        color: 'text-blue-400',   dot: 'bg-blue-400'   },
  login_oauth:      { label: 'Signed in via OAuth',    Icon: Globe,         color: 'text-purple-400', dot: 'bg-purple-400' },
  login_failed:     { label: 'Failed sign-in attempt', Icon: AlertTriangle, color: 'text-red-400',    dot: 'bg-red-400'    },
  password_changed: { label: 'Password changed',       Icon: KeyRound,      color: 'text-amber-400',  dot: 'bg-amber-400'  },
  password_reset:   { label: 'Password reset',         Icon: KeyRound,      color: 'text-orange-400', dot: 'bg-orange-400' },
  email_verified:   { label: 'Email verified',         Icon: UserCheck,     color: 'text-green-400',  dot: 'bg-green-400'  },
  profile_updated:  { label: 'Profile updated',        Icon: BadgeCheck,    color: 'text-blue-400',   dot: 'bg-blue-400'   },
  face_enrolled:    { label: 'Face ID enrolled',       Icon: Camera,        color: 'text-indigo-400', dot: 'bg-indigo-400' },
  account_created:  { label: 'Account created',        Icon: UserCheck,     color: 'text-green-400',  dot: 'bg-green-400'  },
};

const formatRelativeTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── ActivityLog ──────────────────────────────────────────────────────────────

const ActivityLog = memo(({ isDark }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token  = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token || !userId) return;
        const res = await fetch(`http://127.0.0.1:3000/api/activity/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load activity');
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full animate-pulse flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className="flex-1 space-y-1.5">
            <div className={`h-3 w-36 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            <div className={`h-2 w-24 rounded animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
          </div>
        </div>
      ))}
    </div>
  );

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  if (entries.length === 0) return (
    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No activity recorded yet.</p>
  );

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const meta = EVENT_META[entry.event] ?? { label: entry.event, Icon: ShieldCheck, color: 'text-gray-400', dot: 'bg-gray-400' };
        const { Icon, label, color, dot } = meta;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center flex-shrink-0 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              {i < entries.length - 1 && (
                <span className={`w-px flex-1 min-h-[20px] mt-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="flex items-start gap-2 pb-3 flex-1 min-w-0">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
              <div className="min-w-0">
                <p className={`text-sm font-medium leading-tight ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
                <div className={`flex flex-wrap gap-x-3 mt-0.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <span title={new Date(entry.timestamp).toLocaleString()}>{formatRelativeTime(entry.timestamp)}</span>
                  {entry.device && <span>{entry.device}</span>}
                  {entry.ip    && <span>{entry.ip}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
ActivityLog.displayName = 'ActivityLog';

// ─── PlaceholderTab ───────────────────────────────────────────────────────────

const PlaceholderTab = memo(({ title, description }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`backdrop-blur-md rounded-xl p-8 border text-center transition-colors duration-300 ${
      isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'
    }`}>
      <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
        <Settings className="w-8 h-8 text-white" />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This section is under development</p>
    </div>
  );
});
PlaceholderTab.propTypes = { title: PropTypes.string.isRequired, description: PropTypes.string.isRequired };
PlaceholderTab.displayName = 'PlaceholderTab';

// ─── StatPill — view mode row ─────────────────────────────────────────────────

const StatPill = memo(({ icon: Icon, label, value, isDark }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-red-400" />
    </div>
    <div className="min-w-0">
      <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{value || '—'}</p>
    </div>
  </div>
));
StatPill.displayName = 'StatPill';

// ─── EditPill — edit mode: same shell, input replaces value ──────────────────

const EditPill = memo(({ icon: Icon, label, name, value, onChange, isDark, type = 'text' }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-red-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className={`text-xs font-medium mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className={`w-full bg-transparent text-sm font-semibold outline-none border-b transition-colors ${
          isDark
            ? 'text-white border-gray-600 focus:border-red-400 placeholder-gray-600'
            : 'text-gray-900 border-gray-300 focus:border-red-400 placeholder-gray-400'
        }`}
      />
    </div>
  </div>
));
EditPill.displayName = 'EditPill';

// ─── AvatarRing ───────────────────────────────────────────────────────────────

const AvatarRing = memo(({ src, firstName, lastName }) => (
  <div className="w-24 h-24 rounded-full relative flex-shrink-0">
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-gray-600 animate-[spin_6s_linear_infinite] opacity-70" />
    <div className="absolute inset-[3px] rounded-full bg-gray-900" />
    <div className="absolute inset-[4px] rounded-full overflow-hidden">
      {src
        ? <img src={src} alt="avatar" className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <span className="text-white font-bold text-2xl select-none">{initials(firstName, lastName)}</span>
          </div>
      }
    </div>
  </div>
));
AvatarRing.displayName = 'AvatarRing';

// ─── InstructorProfileSection ─────────────────────────────────────────────────

const InstructorProfileSection = memo(({ userId, isDark }) => {
  const [data,    setData]    = useState({ department: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ department: '', bio: '' });
  const [message, setMessage] = useState('');

  const cardCls = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;
  const inputCls = `w-full bg-transparent text-sm font-semibold outline-none border-b transition-colors ${
    isDark ? 'text-white border-gray-600 focus:border-red-400 placeholder-gray-600'
           : 'text-gray-900 border-gray-300 focus:border-red-400 placeholder-gray-400'
  }`;
  const textareaCls = `w-full bg-transparent text-sm font-semibold outline-none border-b transition-colors resize-none ${
    isDark ? 'text-white border-gray-600 focus:border-red-400 placeholder-gray-600'
           : 'text-gray-900 border-gray-300 focus:border-red-400 placeholder-gray-400'
  }`;

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !userId) return;
        const res = await fetch(`http://127.0.0.1:3000/api/profile/${userId}/instructor`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const ip = json.instructorProfile ?? {};
        const loaded = { department: ip.department ?? '', bio: ip.bio ?? '' };
        setData(loaded);
        setForm(loaded);
      } catch (err) {
        console.error('Failed to load instructor profile', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setMessage('');
    setForm({ ...data });
  }, [data]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:3000/api/profile/${userId}/instructor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Update failed');
      const ip = json.instructorProfile ?? {};
      setData({ department: ip.department ?? form.department, bio: ip.bio ?? form.bio });
      setEditing(false);
      setMessage('Instructor details updated successfully');
    } catch (err) {
      setMessage(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [form, userId]);

  if (loading) return (
    <div className={`${cardCls} p-6 space-y-3`}>
      {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <div className={`${cardCls} p-6 space-y-4`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <BookOpen className="w-3.5 h-3.5" /> Instructor Details
        </h3>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleCancel}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isDark ? 'border-white/15 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}>
                <X className="w-3 h-3" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all">
                {saving
                  ? <><RefreshCw className="w-3 h-3 animate-spin" /> Saving…</>
                  : <><Save className="w-3 h-3" /> Save</>}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isDark ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' : 'border-red-400 text-red-500 hover:bg-red-50'
              }`}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Department */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Department</p>
          {editing
            ? <input name="department" value={form.department} onChange={handleChange}
                placeholder="e.g. Computer Science" className={inputCls} />
            : <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.department || '—'}</p>
          }
        </div>
      </div>

      {/* Bio */}
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Bio <span className="normal-case font-normal">(optional)</span>
          </p>
          {editing
            ? <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                placeholder="Tell students a little about yourself…" className={textareaCls} />
            : <p className={`text-sm font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {data.bio || '—'}
              </p>
          }
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
          message.includes('successfully')
            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
            : 'bg-red-500/15 text-red-400 border border-red-500/20'
        }`}>
          {message.includes('successfully')
            ? <BadgeCheck className="w-4 h-4 flex-shrink-0" />
            : <X className="w-4 h-4 flex-shrink-0" />}
          {message}
        </div>
      )}
    </div>
  );
});
InstructorProfileSection.displayName = 'InstructorProfileSection';

// ─── ProfileSettings ──────────────────────────────────────────────────────────

const ProfileSettings = memo(() => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef(null);
  const { validateFace, validating } = useFaceValidation();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [message,   setMessage]   = useState('');
  const [form,      setForm]      = useState({});
  const [faceError, setFaceError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token  = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token || !userId) return;
        const res = await fetch(`http://127.0.0.1:3000/api/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data);
        setForm({
          username:     data.username,
          firstName:    data.firstName,
          lastName:     data.lastName,
          phone:        data.phone,
          dateOfBirth:  data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
          profileImage: data.profileImage ?? '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaceError('');
    const { valid, error } = await validateFace(file);
    if (!valid) {
      setFaceError(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, profileImage: reader.result }));
    reader.readAsDataURL(file);
  }, [validateFace]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setMessage('');
    setFaceError('');
    if (profile) {
      setForm({
        username:     profile.username,
        firstName:    profile.firstName,
        lastName:     profile.lastName,
        phone:        profile.phone,
        dateOfBirth:  profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
        profileImage: profile.profileImage ?? '',
      });
    }
  }, [profile]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage('');
    try {
      const token  = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const res = await fetch(`http://127.0.0.1:3000/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setProfile(data.profile);
      setEditing(false);
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }, [form]);

  const card = `backdrop-blur-md rounded-2xl border transition-colors duration-300 ${
    isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
  }`;

  if (loading) return (
    <div className="space-y-5">
      <div className={`${card} p-8`}>
        <div className="flex gap-6 items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-4 w-32 rounded-lg bg-white/10 animate-pulse" />
          </div>
        </div>
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse mb-3" />)}
      </div>
    </div>
  );

  if (!profile) return (
    <div className={`${card} p-8 text-center`}>
      <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Unable to load profile.</p>
    </div>
  );

  const userId    = localStorage.getItem('userId');
  const role      = ROLE_META[profile.role] ?? ROLE_META.instructor;
  const avatarSrc = editing ? (form.profileImage || null) : (profile.profileImage || null);

  return (
    <div className="space-y-5">

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div className={`${card} p-6 md:p-8`}>
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <AvatarRing src={avatarSrc} firstName={profile.firstName} lastName={profile.lastName} />
            {editing && (
              <>
                <button type="button" onClick={() => !validating && fileInputRef.current?.click()} disabled={validating}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait">
                  {validating ? <Loader className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <h2 className={`text-2xl font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {profile.firstName} {profile.lastName}
            </h2>
            <p className={`text-sm mb-3 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              @{editing ? form.username : profile.username}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${role.bg} ${role.color}`}>
                <role.Icon className="w-3.5 h-3.5" />{role.label}
              </span>
              {profile.isEmailVerified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-green-500/10 border-green-500/30 text-green-400">
                  <BadgeCheck className="w-3.5 h-3.5" />Verified
                </span>
              )}
            </div>
          </div>

          {/* Edit / Save buttons */}
          <div className="flex gap-2 sm:self-start">
            {editing ? (
              <>
                <button onClick={handleCancel}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    isDark ? 'border-white/15 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}>
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving || validating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all hover:scale-105">
                  {saving
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:scale-105 ${
                  isDark ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' : 'border-red-400 text-red-500 hover:bg-red-50'
                }`}>
                <Pencil className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {faceError && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-500/15 text-orange-400 border border-orange-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{faceError}
          </div>
        )}
        {message && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
            message.includes('successfully')
              ? 'bg-green-500/15 text-green-400 border border-green-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20'
          }`}>
            {message.includes('successfully')
              ? <BadgeCheck className="w-4 h-4 flex-shrink-0" />
              : <X className="w-4 h-4 flex-shrink-0" />}
            {message}
          </div>
        )}
      </div>

      {/* ── Account Info (toggles view/edit) + Instructor Details side by side ── */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Account Info card — switches between StatPill (view) and EditPill (edit) */}
        <div className={`${card} p-6 space-y-4`}>
          <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Account Info
          </h3>

          {/* Email is always read-only */}
          <StatPill icon={Mail} label="Email" value={profile.email} isDark={isDark} />

          {editing ? (
            <>
              <EditPill icon={AtSign}   label="Username"      name="username"    value={form.username}    onChange={handleChange} isDark={isDark} />
              <EditPill icon={Phone}    label="Phone"         name="phone"       value={form.phone}       onChange={handleChange} isDark={isDark} type="tel" />
              <EditPill icon={User}     label="First Name"    name="firstName"   value={form.firstName}   onChange={handleChange} isDark={isDark} />
              <EditPill icon={User}     label="Last Name"     name="lastName"    value={form.lastName}    onChange={handleChange} isDark={isDark} />
              <EditPill icon={Calendar} label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} isDark={isDark} type="date" />
            </>
          ) : (
            <>
              <StatPill icon={AtSign}   label="Username"      value={`@${profile.username}`}       isDark={isDark} />
              <StatPill icon={Phone}    label="Phone"         value={profile.phone}                isDark={isDark} />
              <StatPill icon={User}     label="First Name"    value={profile.firstName}            isDark={isDark} />
              <StatPill icon={User}     label="Last Name"     value={profile.lastName}             isDark={isDark} />
              <StatPill icon={Calendar} label="Date of Birth" value={fmtDate(profile.dateOfBirth)} isDark={isDark} />
            </>
          )}
        </div>

        {/* Instructor Details — sits right beside Account Info */}
        {profile.role === 'instructor' && (
          <InstructorProfileSection userId={userId} isDark={isDark} />
        )}

      </div>
    </div>
  );
});
ProfileSettings.displayName = 'ProfileSettings';

// ─── SecuritySettings ─────────────────────────────────────────────────────────

const SecuritySettings = memo(({
  showCurrentPassword, showNewPassword, showConfirmPassword,
  passwordForm, passwordStrength, isChangingPassword, passwordMessage,
  handlePasswordChange, handlePasswordSubmit,
  setShowCurrentPassword, setShowNewPassword, setShowConfirmPassword,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const inputClasses = `w-full px-4 py-3 rounded-lg transition-all duration-300 border focus:ring-2 ${
    isDark
      ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-400 focus:ring-red-400/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20'
  }`;
  const cardClasses = `backdrop-blur-md rounded-xl p-6 border transition-colors duration-300 ${
    isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'
  }`;
  const labelClasses = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="space-y-8">
      <div className={cardClasses}>
        <h3 className={`text-xl font-bold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Lock className="w-5 h-5 mr-2 text-red-500" />Change Password
        </h3>
        <form className="space-y-6" onSubmit={handlePasswordSubmit}>

          <div>
            <label className={labelClasses}>Current Password</label>
            <div className="relative">
              <input type={showCurrentPassword ? 'text' : 'password'} value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className={inputClasses} placeholder="Enter your current password" required autoFocus />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={`absolute right-3 top-3 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClasses}>New Password</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={inputClasses} placeholder="Enter your new password" required />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute right-3 top-3 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordForm.newPassword && (
              <div className="mt-2 flex items-center space-x-2">
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }} />
                </div>
                <span className={`text-xs font-medium ${passwordStrength >= 3 ? 'text-green-500' : 'text-red-500'}`}>
                  {getPasswordStrengthText(passwordStrength)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className={labelClasses}>Confirm New Password</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={inputClasses} placeholder="Confirm your new password" required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-3 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <button type="submit"
              disabled={isChangingPassword || passwordStrength < 3 || passwordForm.newPassword !== passwordForm.confirmPassword}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105">
              {isChangingPassword
                ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Changing Password…</>
                : <><Save className="w-4 h-4 mr-2" />Change Password</>}
            </button>
            {passwordMessage && (
              <div className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                passwordMessage.includes('successfully') ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}>
                {passwordMessage.includes('successfully') ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                {passwordMessage}
              </div>
            )}
          </div>

        </form>
      </div>

      <div className={cardClasses}>
        <h3 className={`text-xl font-bold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />Recent Security Activity
        </h3>
        <ActivityLog isDark={isDark} />
      </div>
    </div>
  );
});

SecuritySettings.propTypes = {
  showCurrentPassword:    PropTypes.bool.isRequired,
  showNewPassword:        PropTypes.bool.isRequired,
  showConfirmPassword:    PropTypes.bool.isRequired,
  passwordForm:           PropTypes.shape({
    currentPassword: PropTypes.string,
    newPassword:     PropTypes.string,
    confirmPassword: PropTypes.string,
  }).isRequired,
  passwordStrength:       PropTypes.number.isRequired,
  isChangingPassword:     PropTypes.bool.isRequired,
  passwordMessage:        PropTypes.string.isRequired,
  handlePasswordChange:   PropTypes.func.isRequired,
  handlePasswordSubmit:   PropTypes.func.isRequired,
  setShowCurrentPassword: PropTypes.func.isRequired,
  setShowNewPassword:     PropTypes.func.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
};
SecuritySettings.displayName = 'SecuritySettings';

// ─── TeacherSettings (root) ───────────────────────────────────────────────────

const TeacherSettings = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab,           setActiveTab]           = useState('security');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword,     setShowNewPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword,  setIsChangingPassword]  = useState(false);
  const [passwordForm,        setPasswordForm]        = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStrength,    setPasswordStrength]    = useState(0);
  const [passwordMessage,     setPasswordMessage]     = useState('');

  const settingsTabs = [
    { id: 'security',      label: 'Security',      icon: Shield,  description: 'Password and security settings'       },
    { id: 'profile',       label: 'Profile',       icon: User,    description: 'Personal information and preferences' },
    { id: 'notifications', label: 'Notifications', icon: Bell,    description: 'Notification preferences'             },
    { id: 'appearance',    label: 'Appearance',    icon: Palette, description: 'Theme and display settings'           },
    { id: 'language',      label: 'Language',      icon: Globe,   description: 'Language and region settings'         },
  ];

  const handlePasswordChange = useCallback((field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (field === 'newPassword') setPasswordStrength(checkPasswordStrength(value));
  }, []);

  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('Passwords do not match');
      return;
    }
    if (passwordStrength < 3) {
      setPasswordMessage('Password is too weak');
      return;
    }
    setIsChangingPassword(true);
    try {
      const token  = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) throw new Error('Session expired. Please login again.');
      const res = await fetch(`http://127.0.0.1:3000/api/change_password/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          old_password:     passwordForm.currentPassword,
          new_password:     passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      setPasswordMessage('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength(0);
    } catch (err) {
      setPasswordMessage(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordForm, passwordStrength]);

  const securityProps = {
    showCurrentPassword, showNewPassword, showConfirmPassword,
    passwordForm, passwordStrength, isChangingPassword, passwordMessage,
    handlePasswordChange, handlePasswordSubmit,
    setShowCurrentPassword, setShowNewPassword, setShowConfirmPassword,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'security':      return <SecuritySettings {...securityProps} />;
      case 'profile':       return <ProfileSettings />;
      case 'notifications': return <PlaceholderTab title="Notification Settings"  description="Configure how you receive notifications and alerts" />;
      case 'appearance':    return <PlaceholderTab title="Appearance Settings"    description="Customize the look and feel of your dashboard" />;
      case 'language':      return <PlaceholderTab title="Language Settings"      description="Change your language and regional preferences" />;
      default:              return <SecuritySettings {...securityProps} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400 mb-4">
          Settings
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Manage your account preferences and security settings
        </p>
      </div>

      <div className="w-full flex justify-center">
        <div className="inline-flex backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-1">
          <div className="flex flex-wrap gap-1">
            {settingsTabs.map(({ id, label, icon: Icon, description }) => (
              <button key={id} onClick={() => setActiveTab(id)} title={description}
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                  activeTab === id
                    ? isDark
                      ? 'bg-gradient-to-r from-red-500/20 to-gray-500/20 text-white shadow-lg'
                      : 'bg-gradient-to-r from-red-100 to-gray-200 text-gray-900 shadow-lg'
                    : isDark
                      ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}>
                <Icon size={18} className="mr-2" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[400px]">{renderTabContent()}</div>
    </div>
  );
};

export default TeacherSettings;