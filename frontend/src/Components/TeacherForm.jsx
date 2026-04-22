// TeacherForm.jsx
import { useState } from 'react';
import { Edit, UserPlus, Save, X } from 'lucide-react';

const TeacherForm = ({ onSubmit, onCancel, mode = 'add', initialData = {} }) => {

  // ✅ Lazy initializer — no useEffect, no ESLint error
  const [formData, setFormData] = useState(() => ({
    username:    initialData?.username                                            || '',
    firstName:   initialData?.firstName   || initialData?.first_name             || '',
    lastName:    initialData?.lastName    || initialData?.last_name              || '',
    email:       initialData?.email                                              || '',
    password:    '', // never pre-fill
    cin:         initialData?.cin                                                || '',
    phone:       initialData?.phone       || initialData?.phone_num              || '',
    dateOfBirth: initialData?.dateOfBirth || (initialData?.birth_date
                   ? new Date(initialData.birth_date).toISOString().split('T')[0]
                   : ''),
    department:  initialData?.department  || initialData?.profile?.department   || '',
    bio:         initialData?.bio         || initialData?.profile?.bio          || '',
  }));

  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName.trim())  e.firstName  = 'First name is required';
    if (!formData.lastName.trim())   e.lastName   = 'Last name is required';
    if (!formData.email.trim())      e.email      = 'Email is required';
    if (!formData.department.trim()) e.department = 'Department is required';
    if (mode === 'add') {
      if (!formData.username.trim())       e.username    = 'Username is required';
      if (!formData.password.trim())       e.password    = 'Password is required';
      else if (formData.password.length < 6) e.password  = 'Min 6 characters';
      if (!formData.phone.trim())          e.phone       = 'Phone is required';
      if (!formData.dateOfBirth)           e.dateOfBirth = 'Birth date is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Invalid email format';
    if (formData.cin && !/^\d{8}$/.test(formData.cin))
      e.cin = 'CIN must be 8 digits';
    if (formData.phone && !/^\d{8}$/.test(formData.phone))
      e.phone = 'Phone must be 8 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    try {
      // ✅ add mode sends all required CreateTeacherDto fields
      // ✅ edit mode sends only optional UpdateTeacherDto fields
      const payload = mode === 'add'
        ? {
            username:    formData.username,
            firstName:   formData.firstName,
            lastName:    formData.lastName,
            email:       formData.email,
            password:    formData.password,
            phone:       formData.phone,
            dateOfBirth: formData.dateOfBirth,
            cin:         formData.cin        || undefined,
            department:  formData.department,
            bio:         formData.bio        || undefined,
          }
        : {
            firstName:   formData.firstName   || undefined,
            lastName:    formData.lastName    || undefined,
            email:       formData.email       || undefined,
            phone:       formData.phone       || undefined,
            dateOfBirth: formData.dateOfBirth || undefined,
            cin:         formData.cin         || undefined,
            department:  formData.department  || undefined,
            bio:         formData.bio         || undefined,
          };
      await onSubmit(payload);
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const Icon = mode === 'edit' ? Edit : UserPlus;

  const field = (name, label, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-2">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={formData[name]}
        onChange={e => handleChange(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 rounded-lg bg-gray-800/50 border ${
          errors[name] ? 'border-red-500' : 'border-gray-600'
        } text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-none`}
      />
      {errors[name] && <p className="text-red-400 text-sm mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}
      className="backdrop-blur-lg bg-gray-900/30 rounded-2xl p-8 shadow-xl border border-gray-700 max-w-4xl mx-auto space-y-6">

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-gray-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400">
            {mode === 'edit' ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-2 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Add-only fields */}
      {mode === 'add' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {field('username', '👤 Username', 'text',     'john_doe',       true)}
          {field('password', '🔒 Password', 'password', 'Min 6 characters', true)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field('firstName', '👤 First Name', 'text', 'First name', true)}
        {field('lastName',  '👤 Last Name',  'text', 'Last name',  true)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field('email', '✉️ Email', 'email', 'teacher@example.com', true)}
        {field('phone', '📞 Phone', 'tel',   '12345678')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field('cin',         '🪪 CIN',        'text', '12345678')}
        {field('dateOfBirth', '📅 Birth Date', 'date')}
      </div>

      {field('department', '🏫 Department', 'text', 'e.g. Computer Science', true)}

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">📝 Bio</label>
        <textarea
          value={formData.bio}
          onChange={e => handleChange('bio', e.target.value)}
          rows={3}
          placeholder="Optional short bio..."
          className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-none resize-none"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white">
            Cancel
          </button>
        )}
        <button type="submit"
          className={`px-8 py-3 rounded-lg ${
            mode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
          } text-white font-medium flex items-center gap-2 hover:scale-105 transition`}>
          <Save className="w-5 h-5" />
          {mode === 'edit' ? 'Update Teacher' : 'Create Teacher'}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;