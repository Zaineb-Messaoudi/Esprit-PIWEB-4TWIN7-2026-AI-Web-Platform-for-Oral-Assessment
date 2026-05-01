import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Mail, Phone, Calendar, FileText, GraduationCap,
  ToggleLeft, ToggleRight, Shield, AtSign, CheckCircle, XCircle
} from 'lucide-react';
import SearchBar from '../Components/SearchBar';
import { useTheme } from '../context/ThemeContect.jsx';

const API_BASE = 'http://127.0.0.1:3000';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const StudentManagement = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ role value matches your enum: 'student' (lowercase)
      const response = await axios.get(
        `${API_BASE}/admin/users?role=student`,
        authHeaders()
      );
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName ?? ''} ${student.lastName ?? ''}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // ✅ PATCH /admin/users/:id/status  — toggles isActive
  const handleToggleStatus = async (student) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/admin/users/${student._id}/status`,
        { isActive: !student.isActive },
        authHeaders()
      );
      setStudents(prev =>
        prev.map(s => s._id === student._id ? response.data : s)
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // ✅ PATCH /admin/users/:id/role  — changes role
  const handleChangeRole = async (student, newRole) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/admin/users/${student._id}/role`,
        { role: newRole },
        authHeaders()
      );
      setStudents(prev =>
        prev.map(s => s._id === student._id ? response.data : s)
      );
    } catch (err) {
      console.error('Error changing role:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-red-500 to-red-700'
              : 'bg-gradient-to-br from-red-400 to-red-600'
          }`}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold text-transparent bg-clip-text ${
            isDark
              ? 'bg-gradient-to-r from-red-400 to-gray-400'
              : 'bg-gradient-to-r from-red-600 to-gray-700'
          }`}>
            Student Management
          </h1>
        </div>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {students.length} student{students.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <SearchBar onSearch={setSearchTerm} />
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-4 px-6 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchStudents}
            className="mt-2 text-xs text-red-300 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading students...
          </p>
        </div>
      )}

      {/* Student Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student._id}
                className={`group rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isDark
                    ? 'backdrop-blur-lg bg-gray-900/30 border-gray-700 hover:border-red-400/50'
                    : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-red-100/50'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center">
                    {/* Avatar / profile image */}
                    {student.profileImage ? (
                      <img
                        src={student.profileImage}
                        alt={student.firstName}
                        className="w-12 h-12 rounded-xl object-cover shadow-md"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 ${
                        isDark
                          ? 'bg-gradient-to-br from-red-500 to-gray-600'
                          : 'bg-gradient-to-br from-red-400 to-red-600'
                      }`}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}

                    <div className="ml-3">
                      <h3 className={`text-base font-semibold leading-tight ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {student.firstName} {student.lastName}
                      </h3>
                      {/* Active / Inactive badge */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                        student.isActive
                          ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'
                          : isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle active status */}
                  <button
                    onClick={() => handleToggleStatus(student)}
                    title={student.isActive ? 'Deactivate student' : 'Activate student'}
                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                      student.isActive
                        ? isDark ? 'text-green-400 hover:bg-green-400/10' : 'text-green-500 hover:bg-green-50'
                        : isDark ? 'text-gray-400 hover:bg-gray-400/10' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {student.isActive
                      ? <ToggleRight className="w-5 h-5" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                </div>

                {/* Divider */}
                <div className={`h-px mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />

                {/* Info rows */}
                <div className="space-y-2.5 text-sm">

                  {/* Username */}
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-red-500/15' : 'bg-red-50'
                    }`}>
                      <AtSign className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    </div>
                    <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {student.username}
                    </span>
                  </div>

                  {/* Email + verified indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-red-500/15' : 'bg-red-50'
                    }`}>
                      <Mail className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    </div>
                    <span className={`truncate flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {student.email}
                    </span>
                    {/* ✅ isEmailVerified field */}
                    {student.isEmailVerified
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" title="Email verified" />
                      : <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" title="Email not verified" />
                    }
                  </div>

                  {/* Phone — required field in your entity */}
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-red-500/15' : 'bg-red-50'
                    }`}>
                      <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    </div>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      {student.phone}
                    </span>
                  </div>

                  {/* CIN — optional */}
                  {student.cin && (
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDark ? 'bg-red-500/15' : 'bg-red-50'
                      }`}>
                        <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        CIN: <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {student.cin}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Date of birth */}
                  {student.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDark ? 'bg-red-500/15' : 'bg-red-50'
                      }`}>
                        <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        {new Date(student.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Role changer */}
                <div className={`mt-4 pt-4 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium uppercase tracking-wide ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>Change Role</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {/* ✅ Role values match your UserRole enum exactly */}
                    {['student', 'instructor', 'admin'].map(role => (
                      <button
                        key={role}
                        onClick={() => handleChangeRole(student, role)}
                        disabled={student.role === role}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                          student.role === role
                            ? isDark
                              ? 'bg-red-600/30 text-red-300 border border-red-500/30 cursor-default'
                              : 'bg-red-100 text-red-600 border border-red-200 cursor-default'
                            : isDark
                              ? 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-red-400/50 hover:text-red-300'
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-500'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <GraduationCap className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No students found
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Try adjusting your search term
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentManagement;