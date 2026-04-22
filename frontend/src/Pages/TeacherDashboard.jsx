import React, { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  Users,
  FileText,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Library,
  UserCheck,
  Video,
  HelpCircle,
  TrendingUp,
  Award, PieChart, Mail, Star, Plus, Edit, Eye,
  Sun, Moon,
  Layers,
  Target,
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import TeacherSettings from '../Components/TeacherSettings';
import MyCoursesTeacher from './MyCoursesTeacher.jsx';
import CourseList from '../Components/CourseList';
import { useTheme } from '../context/ThemeContect.jsx';

const PlaceholderPage = ({ title, description }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text mb-4 ${
          isDark
            ? 'bg-gradient-to-r from-red-400 to-gray-400'
            : 'bg-gradient-to-r from-red-600 to-gray-700'
        }`}>
          {title}
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      <div className={`backdrop-blur-md rounded-xl p-8 border text-center ${
        isDark ? 'bg-white/10 border-white/20' : 'bg-white/70 border-gray-300'
      }`}>
        <div className="mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Teacher Module
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            This module would be imported from:{' '}
            <code className={`px-2 py-1 rounded ${
              isDark ? 'bg-gray-800 text-red-400' : 'bg-gray-200 text-red-600'
            }`}>
              ./teacher/{title.replace(/\s+/g, '')}
            </code>
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Create a separate component file and import it at the top of this dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

const TeacherOverview = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text mb-4 ${
          isDark
            ? 'bg-gradient-to-r from-red-400 to-gray-400'
            : 'bg-gradient-to-r from-red-600 to-gray-700'
        }`}>
          Welcome Back, Professor!
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Your teaching dashboard — manage classes, track student progress, and create engaging content
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: Users,        value: '156', label: 'Total Students',    sub: '+12 this month',      subColor: isDark ? 'text-green-400' : 'text-green-600' },
          { icon: BookOpen,     value: '8',   label: 'Active Courses',    sub: '2 new this semester', subColor: isDark ? 'text-red-400'   : 'text-red-600'   },
          { icon: ClipboardList,value: '24',  label: 'Pending Reviews',   sub: '6 urgent',            subColor: isDark ? 'text-yellow-400': 'text-yellow-600', iconColor: isDark ? 'text-green-400' : 'text-green-600' },
          { icon: TrendingUp,   value: '87%', label: 'Avg. Performance',  sub: '+5% improvement',     subColor: isDark ? 'text-green-400' : 'text-green-600', iconColor: isDark ? 'text-yellow-400': 'text-yellow-600' },
        ].map(({ icon: Icon, value, label, sub, subColor, iconColor }, i) => (
          <div
            key={i}
            className={`backdrop-blur-md rounded-xl p-6 border hover:scale-105 transition-all duration-300 ${
              isDark
                ? 'bg-white/10 border-white/20 hover:bg-white/20'
                : 'bg-white/80 border-gray-300 hover:bg-white shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <Icon className={`w-8 h-8 ${iconColor || (isDark ? 'text-red-400' : 'text-red-600')}`} />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
            <p className={`text-sm ${subColor}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Schedule + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`backdrop-blur-md rounded-xl p-6 border ${
          isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-300 shadow-lg'
        }`}>
          <h3 className={`text-xl font-bold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Calendar className={`w-5 h-5 mr-2 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            Today's Schedule
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Advanced Mathematics', sub: 'Room 204 · 45 students', time: '09:00' },
              { title: 'Physics Lab Session',  sub: 'Lab 3 · 20 students',    time: '14:00' },
              { title: 'Office Hours',         sub: 'Room 105 · Open',        time: '16:00' },
            ].map(({ title, sub, time }, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-red-500/20' : 'bg-red-50'
                }`}
              >
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{sub}</p>
                </div>
                <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`backdrop-blur-md rounded-xl p-6 border ${
          isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-300 shadow-lg'
        }`}>
          <h3 className={`text-xl font-bold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Bell className={`w-5 h-5 mr-2 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { text: 'New assignment submitted by John Doe',                         time: '2 minutes ago' },
              { text: 'Quiz "Quantum Mechanics" completed by 25 students',            time: '1 hour ago'    },
              { text: 'New forum discussion started in "General Physics"',            time: '3 hours ago'   },
            ].map(({ text, time }, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isDark ? 'bg-red-400' : 'bg-red-500'}`}></div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{text}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AnimatedBackground = ({ isDark }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
      isDark ? 'bg-red-500/20' : 'bg-red-300/30'
    }`}></div>
    <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
      isDark ? 'bg-gray-500/20' : 'bg-gray-300/30'
    }`}></div>
    <div className={`absolute top-1/2 left-1/2 w-60 h-60 rounded-full blur-2xl animate-spin-slower ${
      isDark ? 'bg-red-500/10' : 'bg-red-200/20'
    }`}></div>
  </div>
);

const TeacherDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const menuItems = [
    { id: 'overview',       label: 'Dashboard',         icon: Home,          description: 'Overview of your teaching activities',    path: '/teacherdashboard'              },
    { id: 'quizzes',        label: 'Quizzes',            icon: ClipboardList, description: 'Create and manage assignments',           path: '/teacherdashboard/quizzes'      },
        { id: 'assignments', label: 'Assignments', icon: Target, description: 'Manage audio/video assignments', path: '/teacherdashboard/assignments' },
    // ─── Class Management ──────────────────────────────────────────────────────
    { id: 'classes',        label: 'My Classes',   icon: Layers,        description: 'Manage your classes and student lists',   path: '/teacherdashboard/classes/'      },
    { id: 'sessions',       label: 'Live Sessions', icon: Video,        description: 'Run oral recording sessions',             path: '/teacherdashboard/sessions' },
    { id: 'submissions', label: 'Submissions', icon: FileText, description: 'Review submissions and find missing work', path: '/teacherdashboard/submissions' },
    { id: 'attendance',     label: 'Attendance',         icon: UserCheck,     description: 'Track student attendance',                path: '/teacherdashboard/attendance'   },
    { id: 'analytics',      label: 'Analytics',          icon: BarChart3,     description: 'Student performance analytics',           path: '/teacherdashboard/analytics'    },
    { id: 'schedule',       label: 'Class Schedule',     icon: Calendar,      description: 'Manage your teaching schedule',           path: '/teacherdashboard/schedule'     },
    { id: 'content',        label: 'Content Library',    icon: Library,       description: 'Course materials and resources',          path: '/teacherdashboard/content'      },
    { id: 'live_classes',   label: 'Live Classes',       icon: Video,         description: 'Conduct virtual classes',                 path: '/teacherdashboard/live_classes' },
    { id: 'forums',         label: 'Discussion Forums',  icon: MessageSquare, description: 'Moderate class discussions',              path: '/teacherdashboard/forums'       },
    { id: 'notifications',  label: 'Notifications',      icon: Bell,          description: 'System alerts and updates',               path: '/teacherdashboard/notifications'},
    { id: 'support',        label: 'Support',            icon: HelpCircle,    description: 'Get help and report issues',              path: '/teacherdashboard/support'      },
    { id: 'settings',       label: 'Settings',           icon: Settings,      description: 'Configure your preferences',             path: '/teacherdashboard/settings'     },
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-red-900 to-gray-900'
        : 'bg-gradient-to-br from-gray-100 via-red-100 to-gray-200'
    }`}>
      <AnimatedBackground isDark={isDark} />

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div className={`backdrop-blur-md shadow-2xl transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${
          isDark
            ? 'bg-black/20 border-r border-white/10'
            : 'bg-white/80 border-r border-gray-200'
        }`}>
          <div className={`p-4 flex flex-col items-center ${
            isDark ? 'border-b border-white/10' : 'border-b border-gray-200'
          }`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between w-full">
                {/* Logo */}
                <div className="flex items-center">
                  <GraduationCap className={`w-8 h-8 mr-2 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <h1 className={`text-xl font-bold bg-clip-text text-transparent ${
                    isDark
                      ? 'bg-gradient-to-r from-red-400 to-gray-400'
                      : 'bg-gradient-to-r from-red-600 to-gray-700'
                  }`}>
                    TeacherHub
                  </h1>
                </div>

                {/* Right buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? 'text-yellow-300 hover:bg-white/10'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Toggle theme"
                  >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </button>

                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-700 hover:bg-gray-200'
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
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          <nav className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.id === 'overview' && location.pathname === '/teacherdashboard');
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`w-full flex items-center px-4 py-3 text-left transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-red-500/20 to-gray-500/20 border-r-2 border-red-400 text-white shadow-lg'
                        : 'bg-gradient-to-r from-red-100 to-gray-100 border-r-2 border-red-600 text-gray-900 shadow-md'
                      : isDark
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                  title={!sidebarCollapsed ? item.description : item.label}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 relative z-10">
            <div className={`backdrop-blur-lg rounded-2xl shadow-xl min-h-[calc(100vh-4rem)] p-4 md:p-8 ${
              isDark
                ? 'bg-gray-900/30 border border-gray-700'
                : 'bg-white/80 border border-gray-200'
            }`}>
              {location.pathname === '/teacherdashboard' || location.pathname === '/teacherdashboard/overview' ? (
                <TeacherOverview />
              ) : (
                <Outlet />
              )}
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

export default TeacherDashboard;