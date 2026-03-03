import { useState, useCallback, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Shield,
  User,
  Bell,
  Palette,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Settings,
  Save,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

// ─── Utility Functions ────────────────────────────────────────────────────────

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

// ─── PlaceholderTab ───────────────────────────────────────────────────────────

const PlaceholderTab = memo(({ title, description }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`backdrop-blur-md rounded-xl p-8 border text-center transition-colors duration-300 ${
        isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'
      }`}
    >
      <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
        <Settings className="w-8 h-8 text-white" />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        This section is under development
      </p>
    </div>
  );
});

PlaceholderTab.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};
PlaceholderTab.displayName = 'PlaceholderTab';

// ─── ProfileSettings (Instructor) ────────────────────────────────────────────

const ProfileSettings = memo(() => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    department: '',
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profileExists, setProfileExists] = useState(false);

  const cardClasses = `backdrop-blur-md rounded-xl p-6 border transition-colors duration-300 ${
    isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'
  }`;

  const inputClasses = `w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 ${
    isDark
      ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-400 focus:ring-red-400/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20'
  }`;

  const labelClasses = `block text-sm font-medium mb-2 ${
    isDark ? 'text-gray-300' : 'text-gray-700'
  }`;

  // Load existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3000/profiles/instructor/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setFormData({
              department: data.department || '',
              bio: data.bio || '',
            });
            setProfileExists(true);
          }
        }
      } catch (err) {
        console.error('Failed to load instructor profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSaving(true);

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setMessage('Session expired. Please login again.');
      setIsSaving(false);
      return;
    }

    try {
      const method = profileExists ? 'PUT' : 'POST';
      const url = `http://localhost:3000/profiles/instructor/${userId}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save profile');
      }

      setProfileExists(true);
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Profile save error:', err);
      setMessage(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cardClasses}>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-red-500 mr-2" />
          <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      <h3
        className={`text-xl font-bold mb-6 flex items-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        <BookOpen className="w-5 h-5 mr-2 text-red-500" />
        Instructor Profile
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Department */}
        <div>
          <label htmlFor="department" className={labelClasses}>
            Department
          </label>
          <input
            id="department"
            name="department"
            type="text"
            value={formData.department}
            onChange={handleChange}
            required
            placeholder="e.g. Computer Science"
            className={inputClasses}
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className={labelClasses}>
            Bio <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Tell students a little about yourself..."
            className={`${inputClasses} resize-none`}
          />
        </div>

        {/* Submit Row */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </button>

          {message && (
            <div
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                message.includes('successfully')
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-red-500/20 text-red-500'
              }`}
            >
              {message.includes('successfully') ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {message}
            </div>
          )}
        </div>

      </form>
    </div>
  );
});

ProfileSettings.displayName = 'ProfileSettings';

// ─── SecuritySettings ─────────────────────────────────────────────────────────

const SecuritySettings = memo(({
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  passwordForm,
  passwordStrength,
  isChangingPassword,
  passwordMessage,
  handlePasswordChange,
  handlePasswordSubmit,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const inputClasses = `w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 ${
    isDark
      ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-400 focus:ring-red-400/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20'
  }`;

  const cardClasses = `backdrop-blur-md rounded-xl p-6 border transition-colors duration-300 ${
    isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'
  }`;

  const labelClasses = `block text-sm font-medium mb-2 ${
    isDark ? 'text-gray-300' : 'text-gray-700'
  }`;

  return (
    <div className="space-y-8">
      {/* Password Card */}
      <div className={cardClasses}>
        <h3
          className={`text-xl font-bold mb-4 flex items-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <Lock className="w-5 h-5 mr-2 text-red-500" />
          Change Password
        </h3>

        <form className="space-y-6" onSubmit={handlePasswordSubmit}>

          {/* Current Password */}
          <div>
            <label className={labelClasses}>Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className={inputClasses}
                placeholder="Enter your current password"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={`absolute right-3 top-3 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className={labelClasses}>New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={inputClasses}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={`absolute right-3 top-3 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {passwordForm.newPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className={`flex-1 h-2 rounded-full overflow-hidden ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength >= 3 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelClasses}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={inputClasses}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-3 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={
                isChangingPassword ||
                passwordStrength < 3 ||
                passwordForm.newPassword !== passwordForm.confirmPassword
              }
              className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              {isChangingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </button>

            {passwordMessage && (
              <div
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  passwordMessage.includes('successfully')
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-red-500/20 text-red-500'
                }`}
              >
                {passwordMessage.includes('successfully') ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                {passwordMessage}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Recent Activity */}
      <div className={cardClasses}>
        <h3
          className={`text-xl font-bold mb-4 flex items-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
          Recent Security Activity
        </h3>
        <div className="space-y-3">{/* Activity items */}</div>
      </div>
    </div>
  );
});

SecuritySettings.propTypes = {
  showCurrentPassword: PropTypes.bool.isRequired,
  showNewPassword: PropTypes.bool.isRequired,
  showConfirmPassword: PropTypes.bool.isRequired,
  passwordForm: PropTypes.shape({
    currentPassword: PropTypes.string,
    newPassword: PropTypes.string,
    confirmPassword: PropTypes.string,
  }).isRequired,
  passwordStrength: PropTypes.number.isRequired,
  isChangingPassword: PropTypes.bool.isRequired,
  passwordMessage: PropTypes.string.isRequired,
  handlePasswordChange: PropTypes.func.isRequired,
  handlePasswordSubmit: PropTypes.func.isRequired,
  setShowCurrentPassword: PropTypes.func.isRequired,
  setShowNewPassword: PropTypes.func.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
};
SecuritySettings.displayName = 'SecuritySettings';

// ─── TeacherSettings (Main) ───────────────────────────────────────────────────

const TeacherSettings = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('security');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState('');

  const settingsTabs = [
    { id: 'security',      label: 'Security',       icon: Shield,   description: 'Password and security settings' },
    { id: 'profile',       label: 'Profile',         icon: User,     description: 'Personal information and preferences' },
    { id: 'notifications', label: 'Notifications',   icon: Bell,     description: 'Notification preferences' },
    { id: 'appearance',    label: 'Appearance',      icon: Palette,  description: 'Theme and display settings' },
    { id: 'language',      label: 'Language',        icon: Globe,    description: 'Language and region settings' },
  ];

  const handlePasswordChange = useCallback((field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'newPassword') setPasswordStrength(checkPasswordStrength(value));
  }, []);

  const handlePasswordSubmit = useCallback(
    async (e) => {
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
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token || !userId) throw new Error('Session expired. Please login again.');

        const res = await fetch(`http://127.0.0.1:3000/api/change_password/${userId}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            old_password: passwordForm.currentPassword,
            new_password: passwordForm.newPassword,
            confirm_password: passwordForm.confirmPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Password change failed');

        setPasswordMessage('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (err) {
        setPasswordMessage(err.message || 'Failed to change password');
      } finally {
        setIsChangingPassword(false);
      }
    },
    [passwordForm, passwordStrength]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'security':
        return (
          <SecuritySettings
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            passwordForm={passwordForm}
            passwordStrength={passwordStrength}
            isChangingPassword={isChangingPassword}
            passwordMessage={passwordMessage}
            handlePasswordChange={handlePasswordChange}
            handlePasswordSubmit={handlePasswordSubmit}
            setShowCurrentPassword={setShowCurrentPassword}
            setShowNewPassword={setShowNewPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        );
      case 'profile':
        // ← Your profile form lives here now
        return <ProfileSettings />;
      case 'notifications':
        return <PlaceholderTab title="Notification Settings" description="Configure how you receive notifications and alerts" />;
      case 'appearance':
        return <PlaceholderTab title="Appearance Settings" description="Customize the look and feel of your dashboard" />;
      case 'language':
        return <PlaceholderTab title="Language Settings" description="Change your language and regional preferences" />;
      default:
        return (
          <SecuritySettings
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            passwordForm={passwordForm}
            passwordStrength={passwordStrength}
            isChangingPassword={isChangingPassword}
            passwordMessage={passwordMessage}
            handlePasswordChange={handlePasswordChange}
            handlePasswordSubmit={handlePasswordSubmit}
            setShowCurrentPassword={setShowCurrentPassword}
            setShowNewPassword={setShowNewPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400 mb-4">
          Settings
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Manage your account preferences and security settings
        </p>
      </div>

      {/* Tabs */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-1">
        <div className="flex flex-wrap gap-1">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.description}
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                  activeTab === tab.id
                    ? isDark
                      ? 'bg-gradient-to-r from-red-500/20 to-gray-500/20 text-white shadow-lg'
                      : 'bg-gradient-to-r from-red-100 to-gray-200 text-gray-900 shadow-lg'
                    : isDark
                    ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">{renderTabContent()}</div>
    </div>
  );
};

export default TeacherSettings;
