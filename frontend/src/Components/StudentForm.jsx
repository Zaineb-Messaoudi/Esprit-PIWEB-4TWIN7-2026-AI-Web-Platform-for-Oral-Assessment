// StudentForm.jsx
import { useState } from 'react';
import { GraduationCap, Edit, Save, X } from 'lucide-react';

const StudentForm = ({ onSubmit, onCancel, mode = 'edit', initialData = {} }) => {

  // ✅ Lazy initializer — no useEffect needed, no ESLint error
  const [formData, setFormData] = useState(() => ({
    firstName:      initialData?.firstName      || initialData?.first_name              || '',
    lastName:       initialData?.lastName       || initialData?.last_name               || '',
    email:          initialData?.email                                                  || '',
    cin:            initialData?.cin                                                    || '',
    phone:          initialData?.phone          || initialData?.phone_num               || '',
    dateOfBirth:    initialData?.dateOfBirth    || (initialData?.birth_date
                      ? new Date(initialData.birth_date).toISOString().split('T')[0]
                      : ''),
    level:          initialData?.level          || initialData?.profile?.level          || '',
    major:          initialData?.major          || initialData?.profile?.major          || '',
    enrollmentYear: initialData?.enrollmentYear || initialData?.profile?.enrollmentYear || '',
  }));

  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = 'First name is required';
    if (!formData.lastName.trim())  e.lastName  = 'Last name is required';
    if (!formData.email.trim())     e.email     = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Invalid email format';
    if (formData.cin && !/^\d{8}$/.test(formData.cin))
      e.cin = 'CIN must be 8 digits';
    if (formData.phone && !/^\d{8}$/.test(formData.phone))
      e.phone = 'Phone must be 8 digits';
    if (formData.enrollmentYear && (
      Number(formData.enrollmentYear) < 2000 ||
      Number(formData.enrollmentYear) > new Date().getFullYear()
    )) e.enrollmentYear = 'Invalid year';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit({
        firstName:      formData.firstName      || undefined,
        lastName:       formData.lastName       || undefined,
        email:          formData.email          || undefined,
        phone:          formData.phone          || undefined,
        dateOfBirth:    formData.dateOfBirth    || undefined,
        cin:            formData.cin            || undefined,
        level:          formData.level          || undefined,
        major:          formData.major          || undefined,
        enrollmentYear: formData.enrollmentYear ? Number(formData.enrollmentYear) : undefined,
      });
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  // Reusable input renderer
  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={formData[name]}
        onChange={e => handleChange(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 rounded-lg bg-gray-800/50 border ${
          errors[name] ? 'border-red-500' : 'border-gray-600'
        } text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none`}
      />
      {errors[name] && <p className="text-red-400 text-sm mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}
      className="backdrop-blur-lg bg-gray-900/30 rounded-2xl p-8 shadow-xl border border-gray-700 max-w-4xl mx-auto space-y-6">

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-gray-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <Edit className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-gray-400">
            Edit Student
          </h2>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-2 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field('firstName', '👤 First Name', 'text', 'First name')}
        {field('lastName',  '👤 Last Name',  'text', 'Last name')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field('email', '✉️ Email', 'email', 'student@example.com')}
        {field('phone', '📞 Phone', 'tel',   '12345678')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field('cin',         '🪪 CIN',        'text', '12345678')}
        {field('dateOfBirth', '📅 Birth Date', 'date')}
      </div>

      <div className="rounded-xl border border-gray-700 p-5 space-y-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
          <GraduationCap className="w-4 h-4" /> Academic Profile
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Level</label>
            <select
              value={formData.level}
              onChange={e => handleChange('level', e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Select level</option>
              <option value="bachelor">Bachelor</option>
              <option value="master">Master</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          {field('major',          'Major',           'text',   'e.g. Computer Science')}
          {field('enrollmentYear', 'Enrollment Year', 'number', String(new Date().getFullYear()))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-6 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white">
            Cancel
          </button>
        )}
        <button type="submit"
          className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 hover:scale-105 transition">
          <Save className="w-5 h-5" /> Update Student
        </button>
      </div>
    </form>
  );
};

export default StudentForm;