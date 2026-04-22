import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Building,
  BarChart3,
  Settings,
  Shield,
  Bell,
  Database,
  UserCheck,
  Calendar,
  FileText,
  DollarSign,
  Mail,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import { useTheme } from "../context/ThemeContect.jsx";
import AdminManageTeachers from './AdminManageTeachers';
import CourseList from '../Components/CourseList';
import AdminManageStudents from './AdminManageStudents';
import AdminClassManagement from '../Components/Adminclassmanagement';
import { useLocation, useNavigate } from 'react-router-dom';

const PlaceholderPage = ({ title, description }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text mb-4 ${
          isDark
            ? "bg-gradient-to-r from-red-400 to-gray-400"
            : "bg-gradient-to-r from-red-600 to-gray-700"
        }`}>
          {title}
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}>
          {description}
        </p>
      </div>

      <div className={`backdrop-blur-md rounded-xl p-8 border text-center ${
        isDark
          ? "bg-white/10 border-white/20"
          : "bg-white/70 border-gray-300"
      }`}>
        <div className="mb-4">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isDark
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : "bg-gradient-to-r from-red-400 to-red-500"
          }`}>
            <Star className="w-8 h-8 text-white" />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>Admin Module</h3>
          <p className={`mb-4 ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}>
            This module would be imported from:{' '}
            <code className={`px-2 py-1 rounded ${
              isDark
                ? "bg-gray-800 text-red-400"
                : "bg-gray-200 text-red-600"
            }`}>./admin/{title.replace(/\s+/g, '')}</code>
          </p>
          <p className={`text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}>
            Create a separate component file and import it at the top of this dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminOverview = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text mb-4 ${
          isDark
            ? "bg-gradient-to-r from-red-400 to-gray-400"
            : "bg-gradient-to-r from-red-600 to-gray-700"
        }`}>
          Admin Dashboard
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}>
          System overview and administrative controls for platform management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`backdrop-blur-md rounded-xl p-6 border hover:scale-105 transition-all duration-300 ${
          isDark
            ? "bg-white/10 border-white/20 hover:bg-white/20"
            : "bg-white/80 border-gray-300 hover:bg-white shadow-lg"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <Users className={`w-8 h-8 ${isDark ? "text-red-400" : "text-red-600"}`} />
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>2,847</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Total Users</h3>
          <p className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}>+127 this month</p>
        </div>

        <div className={`backdrop-blur-md rounded-xl p-6 border hover:scale-105 transition-all duration-300 ${
          isDark
            ? "bg-white/10 border-white/20 hover:bg-white/20"
            : "bg-white/80 border-gray-300 hover:bg-white shadow-lg"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <GraduationCap className={`w-8 h-8 ${isDark ? "text-red-400" : "text-red-600"}`} />
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>89</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Active Teachers</h3>
          <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>7 new teachers</p>
        </div>

        <div className={`backdrop-blur-md rounded-xl p-6 border hover:scale-105 transition-all duration-300 ${
          isDark
            ? "bg-white/10 border-white/20 hover:bg-white/20"
            : "bg-white/80 border-gray-300 hover:bg-white shadow-lg"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <BookOpen className={`w-8 h-8 ${isDark ? "text-red-400" : "text-red-600"}`} />
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>342</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Total Courses</h3>
          <p className={`text-sm ${isDark ? "text-blue-400" : "text-blue-600"}`}>18 pending approval</p>
        </div>

        <div className={`backdrop-blur-md rounded-xl p-6 border hover:scale-105 transition-all duration-300 ${
          isDark
            ? "bg-white/10 border-white/20 hover:bg-white/20"
            : "bg-white/80 border-gray-300 hover:bg-white shadow-lg"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <Activity className={`w-8 h-8 ${isDark ? "text-red-400" : "text-red-600"}`} />
            <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>94%</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>System Uptime</h3>
          <p className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}>All systems operational</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`backdrop-blur-md rounded-xl p-6 border ${
          isDark
            ? "bg-white/10 border-white/20"
            : "bg-white/80 border-gray-300 shadow-lg"
        }`}>
          <h3 className={`text-xl font-bold mb-4 flex items-center ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            <AlertTriangle className={`w-5 h-5 mr-2 ${isDark ? "text-red-400" : "text-red-600"}`} />
            System Alerts
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? "bg-red-500/20" : "bg-red-100"
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${isDark ? "bg-red-400" : "bg-red-600"}`}></div>
                <div>
                  <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>High Server Load</p>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Database server at 85% capacity</p>
                </div>
              </div>
              <span className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>Critical</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? "bg-yellow-500/20" : "bg-yellow-100"
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${isDark ? "bg-yellow-400" : "bg-yellow-600"}`}></div>
                <div>
                  <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Pending User Approvals</p>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>24 teacher registrations awaiting review</p>
                </div>
              </div>
              <span className={`text-sm ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>Warning</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDark ? "bg-green-500/20" : "bg-green-100"
            }`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${isDark ? "bg-green-400" : "bg-green-600"}`}></div>
                <div>
                  <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Backup Completed</p>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Daily system backup successful</p>
                </div>
              </div>
              <span className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}>Success</span>
            </div>
          </div>
        </div>

        <div className={`backdrop-blur-md rounded-xl p-6 border ${
          isDark
            ? "bg-white/10 border-white/20"
            : "bg-white/80 border-gray-300 shadow-lg"
        }`}>
          <h3 className={`text-xl font-bold mb-4 flex items-center ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            <TrendingUp className={`w-5 h-5 mr-2 ${isDark ? "text-red-400" : "text-red-600"}`} />
            Platform Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={isDark ? "text-gray-300" : "text-gray-600"}>Daily Active Users</span>
              <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>1,234</span>
            </div>
            <div className={`w-full rounded-full h-2 ${isDark ? "bg-gray-700" : "bg-gray-300"}`}>
              <div className={`h-2 rounded-full ${isDark ? "bg-red-400" : "bg-red-500"}`} style={{ width: '78%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className={isDark ? "text-gray-300" : "text-gray-600"}>Course Completion Rate</span>
              <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>67%</span>
            </div>
            <div className={`w-full rounded-full h-2 ${isDark ? "bg-gray-700" : "bg-gray-300"}`}>
              <div className={`h-2 rounded-full ${isDark ? "bg-red-400" : "bg-red-500"}`} style={{ width: '67%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className={isDark ? "text-gray-300" : "text-gray-600"}>Storage Usage</span>
              <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>2.4TB / 5TB</span>
            </div>
            <div className={`w-full rounded-full h-2 ${isDark ? "bg-gray-700" : "bg-gray-300"}`}>
              <div className={`h-2 rounded-full ${isDark ? "bg-red-400" : "bg-red-500"}`} style={{ width: '48%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`backdrop-blur-md rounded-xl p-6 border ${
        isDark
          ? "bg-white/10 border-white/20"
          : "bg-white/80 border-gray-300 shadow-lg"
      }`}>
        <h3 className={`text-xl font-bold mb-4 flex items-center ${
          isDark ? "text-white" : "text-gray-900"
        }`}>
          <CheckCircle className={`w-5 h-5 mr-2 ${isDark ? "text-red-400" : "text-red-600"}`} />
          Recent Administrative Actions
        </h3>
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isDark ? "bg-gray-500/20" : "bg-gray-100"
          }`}>
            <div className="flex items-center">
              <UserCheck className={`w-4 h-4 mr-3 ${isDark ? "text-red-400" : "text-red-600"}`} />
              <div>
                <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Teacher approved: Dr. Sarah Johnson</p>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Mathematics Department</p>
              </div>
            </div>
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>2 hours ago</span>
          </div>
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isDark ? "bg-gray-500/20" : "bg-gray-100"
          }`}>
            <div className="flex items-center">
              <BookOpen className={`w-4 h-4 mr-3 ${isDark ? "text-red-400" : "text-red-600"}`} />
              <div>
                <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Course published: "Advanced Physics"</p>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>By Prof. Michael Chen</p>
              </div>
            </div>
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>5 hours ago</span>
          </div>
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isDark ? "bg-gray-500/20" : "bg-gray-100"
          }`}>
            <div className="flex items-center">
              <Settings className={`w-4 h-4 mr-3 ${isDark ? "text-red-400" : "text-red-600"}`} />
              <div>
                <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>System maintenance scheduled</p>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Database optimization - Tonight 2:00 AM</p>
              </div>
            </div>
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnimatedBackground = ({ isDark }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
      isDark ? "bg-red-500/20" : "bg-red-300/30"
    }`}></div>
    <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
      isDark ? "bg-gray-500/20" : "bg-gray-300/30"
    }`}></div>
    <div className={`absolute top-1/2 left-1/2 w-60 h-60 rounded-full blur-2xl animate-spin-slower ${
      isDark ? "bg-red-500/10" : "bg-red-200/20"
    }`}></div>
  </div>
);

const AdminDashboard = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const path = location.pathname.split('/AdminDashboard/')[1] || 'overview';
    const normalizedPath = path === '' ? 'overview' : path;
    setCurrentPage(normalizedPath);
  }, [location.pathname]);

  useEffect(() => {
  if (currentPage !== 'course_management') return;

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const coursesResponse = await fetch('http://localhost:3000/classes', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!coursesResponse.ok) throw new Error(`HTTP error! Status: ${coursesResponse.status}`);
      const coursesData = await coursesResponse.json();
      setAllCourses(coursesData);
    } catch (err) {
      setError(`Error fetching courses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  fetchCourses();
}, [currentPage]);

  const handleCourseAction = async (action, courseId) => {
    try {
      let response;
      if (action === 'view') {
        response = await fetch(`http://localhost:3000/courses/${courseId}/`, {
          method: 'GET',
          credentials: 'include',
        });
      }
      if (!response.ok) throw new Error(`Failed to ${action} course: ${response.status}`);
      const updatedCoursesResponse = await fetch('http://localhost:3000/courses/', {
        credentials: 'include',
      });
      if (!updatedCoursesResponse.ok) throw new Error(`Failed to refresh courses: ${updatedCoursesResponse.status}`);
      const updatedCoursesData = await updatedCoursesResponse.json();
      const formattedCourses = updatedCoursesData.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        teacher: course.teacher || { username: course.teacher_name || 'Unknown Teacher' },
        isFollowed: false,
        cover_photo: course.cover_photo || null,
      }));
      setAllCourses(formattedCourses);
    } catch (err) {
      console.error(`${action} action failed:`, err);
    }
  };

  const menuItems = [
    { id: 'overview',               label: 'Dashboard',            icon: Home,         description: 'System overview and key metrics',            path: 'overview'               },
    { id: 'AdminManagingStudents',   label: 'Student Management',   icon: Users,        description: 'Manage students and teachers',               path: 'AdminManagingStudents'  },
    { id: 'AdminManageTeachers',     label: 'Teacher Management',   icon: UserCheck,    description: 'Approve new teacher registrations',          path: 'AdminManageTeachers'    },
    { id: 'course_management',       label: 'Course Management',    icon: BookOpen,     description: 'Oversee all courses and content',            path: 'course_management'      },
    // ─── Class Management ────────────────────────────────────────────────────────
    { id: 'classes',                 label: 'Class Management',     icon: Layers,       description: 'Manage all classes and enrollments',         path: 'classes'                },
    { id: 'institution_settings',    label: 'Institution Settings', icon: Building,     description: 'Configure institutional parameters',         path: 'institution_settings'   },
    { id: 'analytics',               label: 'Analytics & Reports',  icon: BarChart3,    description: 'Platform analytics and reporting',           path: 'analytics'              },
    { id: 'financial',               label: 'Financial Overview',   icon: DollarSign,   description: 'Revenue and financial metrics',              path: 'financial'              },
    { id: 'system_logs',             label: 'System Logs',          icon: Database,     description: 'View system activity logs',                  path: 'system_logs'            },
    { id: 'backup_restore',          label: 'Backup & Restore',     icon: Shield,       description: 'Data backup and recovery',                   path: 'backup_restore'         },
    { id: 'scheduling',              label: 'System Scheduling',    icon: Calendar,     description: 'Manage system maintenance',                  path: 'scheduling'             },
    { id: 'content_moderation',      label: 'Content Moderation',   icon: FileText,     description: 'Review and moderate content',                path: 'content_moderation'     },
    { id: 'notifications',           label: 'System Notifications', icon: Bell,         description: 'Platform-wide notifications',                path: 'notifications'          },
    { id: 'email_management',        label: 'Email Management',     icon: Mail,         description: 'Configure email settings',                   path: 'email_management'       },
    { id: 'support',                 label: 'Support Center',       icon: HelpCircle,   description: 'Admin support and documentation',            path: 'support'                },
    { id: 'settings',                label: 'System Settings',      icon: Settings,     description: 'Configure platform settings',                path: 'settings'               },
  ];

  const renderPage = () => {
    const currentMenuItem = menuItems.find((item) => item.id === currentPage);
    switch (currentPage) {
      case 'overview':
        return <AdminOverview />;
      case 'AdminManagingStudents':
        return <AdminManageStudents />;
      case 'AdminManageTeachers':
        return <AdminManageTeachers />;
      // ─── Class Management ──────────────────────────────────────────────────────
      case 'classes':
        return <AdminClassManagement />;
      case 'course_management':
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text mb-4 ${
                isDark
                  ? "bg-gradient-to-r from-red-400 to-gray-400"
                  : "bg-gradient-to-r from-red-600 to-gray-700"
              }`}>
                Course Management
              </h2>
              <p className={`text-lg max-w-2xl mx-auto ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}>
                Oversee and manage all courses on the platform.
              </p>
            </div>
            <div className={`backdrop-blur-md rounded-xl p-8 border ${
              isDark
                ? "bg-white/10 border-white/20"
                : "bg-white/80 border-gray-300 shadow-lg"
            }`}>
              {loading ? (
                <p className={`text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}>Loading courses...</p>
              ) : error ? (
                <p className={`text-center ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
              ) : (
                <CourseList
                  role="admin"
                  courses={allCourses}
                  onAction={handleCourseAction}
                />
              )}
            </div>
          </div>
        );
      default:
        return (
          <PlaceholderPage
            title={currentMenuItem?.label || 'Page Not Found'}
            description={currentMenuItem?.description || 'This section is under development'}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDark
        ? "bg-gradient-to-br from-gray-900 via-red-900 to-gray-900"
        : "bg-gradient-to-br from-gray-100 via-red-100 to-gray-200"
    }`}>
      <AnimatedBackground isDark={isDark} />
      <div className="flex h-screen relative z-10">

        {/* Sidebar */}
        <div className={`backdrop-blur-md shadow-2xl transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${
          isDark
            ? "bg-black/20 border-r border-white/10"
            : "bg-white/80 border-r border-gray-200"
        }`}>
          <div className={`p-4 flex flex-col items-center ${
            isDark ? "border-b border-white/10" : "border-b border-gray-200"
          }`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Shield className={`w-8 h-8 mr-2 ${isDark ? "text-red-400" : "text-red-600"}`} />
                  <h1 className={`text-xl font-bold bg-clip-text text-transparent ${
                    isDark
                      ? "bg-gradient-to-r from-red-400 to-gray-400"
                      : "bg-gradient-to-r from-red-600 to-gray-700"
                  }`}>
                    AdminHub
                  </h1>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? "text-yellow-300 hover:bg-white/10"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                    title="Toggle theme"
                  >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? "text-white hover:bg-white/10"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDark
                    ? "text-white hover:bg-white/10"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          <nav className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    navigate(`/AdminDashboard/${item.path}`);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-red-500/20 to-gray-500/20 border-r-2 border-red-400 text-white shadow-lg'
                        : 'bg-gradient-to-r from-red-100 to-gray-100 border-r-2 border-red-600 text-gray-900 shadow-md'
                      : isDark
                        ? "text-gray-300 hover:bg-white/10 hover:text-white"
                        : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                  title={!sidebarCollapsed ? item.description : item.label}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 relative z-10">
            <div className={`backdrop-blur-lg rounded-2xl shadow-xl min-h-[calc(100vh-4rem)] p-4 md:p-8 ${
              isDark
                ? "bg-gray-900/30 border border-gray-700"
                : "bg-white/80 border border-gray-200"
            }`}>
              {renderPage()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes spin-slower { to { transform: rotate(360deg); } }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-pulse-slow { animation: pulse 3s infinite; }
        .animate-spin-slower { animation: spin-slower 8s linear infinite; }
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
          border-radius: 2px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;