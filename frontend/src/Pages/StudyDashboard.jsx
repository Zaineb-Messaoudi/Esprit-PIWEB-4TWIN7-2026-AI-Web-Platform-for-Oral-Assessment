import React, { useState } from 'react';
import axios from 'axios';
import {
  Home,
  BookOpen,
  FileText,
  MessageSquare,
  HelpCircle,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Settings,
  Bell,
  Library,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Target,
  Star,
  Sun,
  Moon,
  Layers,
  Video,
} from 'lucide-react';

import StudyOverview from './StudyOverview';
import StudentSettings from '../Components/StudentSettings';
import MyCourses from './MyCourses';
import { NavLink, Outlet } from 'react-router-dom';
import CourseList from '../Components/CourseList';
import { useTheme } from '../context/ThemeContect.jsx';

// ─── Animated Background ──────────────────────────────────────────────────────
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

// ─── Placeholder Page ─────────────────────────────────────────────────────────
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
            Student Module
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            This module would be imported from:{' '}
            <code className={`px-2 py-1 rounded ${
              isDark ? 'bg-gray-800 text-red-400' : 'bg-gray-200 text-red-600'
            }`}>
              ./student/{title.replace(/\s+/g, '')}
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

// ─── Study Dashboard ──────────────────────────────────────────────────────────
const StudyDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const menuItems = [
    { id: 'overview',      label: 'Overview',             icon: Home,          description: 'Study summary and quick insights',      path: ''            },
    { id: 'ExamsQuiz',     label: 'Exams & Quizzes',      icon: FileText,      description: 'Upcoming tests and past results',       path: 'quizzes'     },
    // ─── Class Management ──────────────────────────────────────────────────────
    { id: 'classes',       label: 'My Class',             icon: Layers,        description: 'View your class and classmates',        path: 'classes'     },
    { id: 'Submissions',   label: 'Submissions',         icon: Target,      description: 'Review your submission history',         path: 'submissionshistory' },
    { id: 'assignments',   label: 'Assignments',         icon: Target,      description: 'Track and submit assignments',           path: 'assignments' },
    { id: 'sessions',      label: 'My Session',           icon: Video,        description: 'Check your slot and record',             path: 'sessions' },
    { id: 'schedule',      label: 'Schedule',             icon: Calendar,      description: 'Daily and weekly learning schedule',    path: 'schedule'    },
    { id: 'progress',      label: 'Progress & Analytics', icon: TrendingUp,    description: 'Your learning analytics and goals',     path: 'progress'    },
    { id: 'achievements',  label: 'Achievements',         icon: Award,         description: 'Your badges and certificates',          path: 'achievements'},
    { id: 'library',       label: 'Resource Library',     icon: Library,       description: 'Extra resources and materials',         path: 'library'     },
    { id: 'forum',         label: 'Discussion Forum',     icon: MessageSquare, description: 'Ask and answer questions',              path: 'forum'       },
    { id: 'study_groups',  label: 'Study Groups',         icon: Users,         description: 'Join or create study circles',          path: 'study_groups'},
    { id: 'notifications', label: 'Notifications',        icon: Bell,          description: 'Alerts and important messages',         path: 'notifications'},
    { id: 'support',       label: 'Support Center',       icon: HelpCircle,    description: 'Ask for help or report issues',         path: 'support'     },
    { id: 'settings',      label: 'Settings',             icon: Settings,      description: 'Manage your profile and preferences',   path: 'settings'    },
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-red-900 to-gray-900'
        : 'bg-gradient-to-br from-gray-100 via-red-100 to-gray-200'
    }`}>
      <AnimatedBackground isDark={isDark} />

      <div className="flex h-screen relative z-10">

        {/* ── Sidebar ── */}
        <div className={`backdrop-blur-md shadow-2xl transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${
          isDark
            ? 'bg-black/20 border-r border-white/10'
            : 'bg-white/80 border-r border-gray-200'
        }`}>

          {/* Sidebar Header */}
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
                    StudyHub
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

          {/* Nav Links */}
          <nav className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center px-4 py-3 text-left transition-all duration-300 hover:scale-105 ${
                      isActive
                        ? isDark
                          ? 'bg-gradient-to-r from-red-500/20 to-gray-500/20 border-r-2 border-red-400 text-white shadow-lg'
                          : 'bg-gradient-to-r from-red-100 to-gray-100 border-r-2 border-red-600 text-gray-900 shadow-md'
                        : isDark
                          ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`
                  }
                  title={!sidebarCollapsed ? item.description : item.label}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 relative z-10">
            <div className={`backdrop-blur-lg rounded-2xl shadow-xl min-h-[calc(100vh-4rem)] p-4 md:p-8 ${
              isDark
                ? 'bg-gray-900/30 border border-gray-700'
                : 'bg-white/80 border border-gray-200'
            }`}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes spin-slower { to { transform: rotate(360deg); } }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-pulse-slow  { animation: pulse 3s infinite; }
        .animate-spin-slower { animation: spin-slower 8s linear infinite; }
        nav::-webkit-scrollbar       { width: 4px; }
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

export default StudyDashboard;