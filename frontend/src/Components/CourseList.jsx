import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Star, Play, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContect.jsx';

const CourseList = ({ role, courses, onAction, currentTeacher = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getButtonConfig = (role, isFollowed, teacherName) => {
    const configs = {
      student: [
        {
          action: isFollowed ? 'unfollow' : 'follow',
          icon: Star,
          activeClass: isFollowed ? 'fill-current' : '',
          label: isFollowed ? 'Unfollow' : 'Follow',
        },
        {
          action: 'previewChapters',
          icon: isFollowed ? Play : ChevronDown,
          label: isFollowed ? 'Preview' : 'View Chapters',
        },
      ],
      teacher: [
        ...(teacherName === currentTeacher ? [
          { action: 'viewOwn', icon: ChevronRight, label: 'View Course' },
        ] : []),
      ],
      admin: [
        { action: 'viewChapters', icon: ChevronDown, label: 'View Chapters' },
      ],
    };
    return configs[role] || [];
  };

  const [localCourses, setLocalCourses] = useState(courses);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [chapters, setChapters] = useState({});

  useEffect(() => {
    if (courses && Array.isArray(courses)) {
      setLocalCourses(
          [...courses].sort(
              (a, b) => (b.isFollowed ? 1 : 0) - (a.isFollowed ? 1 : 0)
          )
      );
    } else {
      console.error('Invalid courses prop received:', courses);
      setLocalCourses([]);
    }
  }, [courses]);

  const fetchChapters = async (courseId) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await axios.get(
          `http://127.0.0.1:3000//courses/${courseId}/chapters/`,
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setChapters((prev) => ({
        ...prev,
        [courseId]: response.data.results || response.data || [],
      }));
    } catch (error) {
      console.error(`Failed to fetch chapters for course ${courseId}:`, error);
      setChapters((prev) => ({ ...prev, [courseId]: [] }));
    }
  };

  const handleAction = async (action, courseId) => {
    if (action === 'previewChapters' || action === 'viewChapters') {
      if (expandedCourse !== courseId && !chapters[courseId]) {
        await fetchChapters(courseId);
      }
      setExpandedCourse(expandedCourse === courseId ? null : courseId);
      return;
    } else if (action === 'viewOwn') {
      window.location.href = `http://localhost:5173/courses/${courseId}/`;
      return;
    }

    setLocalCourses((prevCourses) =>
        prevCourses.map((course) =>
            course.id === courseId
                ? { ...course, isFollowed: action === 'follow' }
                : course
        )
    );

    try {
      await onAction(action, courseId);
    } catch (error) {
      setLocalCourses((prevCourses) =>
          prevCourses.map((course) =>
              course.id === courseId
                  ? { ...course, isFollowed: !!(action === 'unfollow') }
                  : course
          )
      );
      console.error(`Action ${action} failed:`, error);
    }
  };

  const getImageSrc = (coverPhoto) => {
    if (!coverPhoto) return null;
    if (coverPhoto.startsWith('http://') || coverPhoto.startsWith('https://')) return coverPhoto;
    return `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'}${coverPhoto.startsWith('/') ? '' : '/'}${coverPhoto}`;
  };

  return (
      <div className="space-y-4">
        {localCourses.map((course, index) => (
            <div
                key={course.id}
                className={`border p-4 rounded-xl shadow animate-fadeIn transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                    isDark
                        ? 'bg-gray-900/40 border-gray-700 hover:border-red-400/40'
                        : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-red-100/50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start">
                {/* Cover image — admin only */}
                {role === 'admin' && (
                    <div className="mr-4 flex-shrink-0">
                      {course.cover_photo ? (
                          <img
                              src={getImageSrc(course.cover_photo)}
                              alt={course.title}
                              className="w-32 h-20 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                          />
                      ) : (
                          <div className={`w-32 h-20 rounded-lg flex items-center justify-center ${
                              isDark ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            <BookOpen className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          </div>
                      )}
                    </div>
                )}

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold mb-0.5 ${
                      isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {course.title}
                  </h3>
                  <p className={`text-sm italic mb-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Taught by{' '}
                    <span className={`not-italic font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {course.teacher?.username || course.teacher_name || course.teacher || 'Unknown Teacher'}
                </span>
                  </p>
                  <p className={`line-clamp-3 text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {course.description}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {getButtonConfig(
                      role,
                      course.isFollowed,
                      course.teacher?.username || course.teacher_name || course.teacher
                  ).map(({ action, icon: Icon, activeClass, label }, index) => (
                      <button
                          key={index}
                          onClick={() => handleAction(action, course.id)}
                          title={label}
                          className={`rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md ${
                              isDark
                                  ? 'bg-red-600 hover:bg-red-500 text-white'
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                      >
                        {Icon && <Icon size={20} className={activeClass || ''} />}
                      </button>
                  ))}
                </div>
              </div>

              {/* Expanded chapters */}
              {(role === 'admin' || (role === 'student' && !course.isFollowed)) &&
                  expandedCourse === course.id && (
                      <div
                          className="overflow-hidden transition-all duration-300 ease-in-out"
                          style={{ maxHeight: expandedCourse === course.id ? '300px' : '0' }}
                      >
                        <div className="mt-4 space-y-2">
                          {chapters[course.id]?.length > 0 ? (
                              chapters[course.id].map((chapter) => (
                                  <div
                                      key={chapter.id}
                                      className={`p-2 rounded-lg text-sm ${
                                          isDark
                                              ? 'bg-gray-800/50 text-gray-200'
                                              : 'bg-gray-100 text-gray-700'
                                      }`}
                                  >
                                    {chapter.title || 'Untitled Chapter'}
                                  </div>
                              ))
                          ) : (
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                No chapters available.
                              </p>
                          )}
                        </div>
                      </div>
                  )}
            </div>
        ))}
      </div>
  );
};

CourseList.propTypes = {
  role: PropTypes.oneOf(['student', 'teacher', 'admin']).isRequired,
  courses: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        teacher: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        isFollowed: PropTypes.bool,
        cover_photo: PropTypes.string,
      })
  ).isRequired,
  onAction: PropTypes.func.isRequired,
  currentTeacher: PropTypes.string,
};

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(styles);
document.adoptedStyleSheets = [styleSheet];

export default CourseList;