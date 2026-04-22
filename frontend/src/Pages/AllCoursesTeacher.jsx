import React, { useState, useEffect } from 'react';
import CourseList from '../Components/CourseList';

const AllCoursesTeacher = () => {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || '';
        const coursesResponse = await fetch('http://localhost:3000/courses/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!coursesResponse.ok) {
          throw new Error(`HTTP error! Status: ${coursesResponse.status}`);
        }
        const coursesData = await coursesResponse.json();

        const formattedCourses = coursesData.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description,
          teacher: course.teacher && typeof course.teacher === 'object'
              ? course.teacher
              : { username: course.teacher || 'Unknown Teacher' },
          isFollowed: false,
        }));

        setAllCourses(formattedCourses);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Error fetching courses: ${err.message}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseAction = async (action, courseId) => {
    try {
      const token = localStorage.getItem('token') || '';
      if (action === 'viewOwn') {
        await fetch(`http://localhost:3000/courses/${courseId}/`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Refresh
      const updatedCoursesResponse = await fetch('http://localhost:3000/courses/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedCoursesData = await updatedCoursesResponse.json();
      const formattedCourses = updatedCoursesData.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        teacher: course.teacher && typeof course.teacher === 'object'
            ? course.teacher
            : { username: course.teacher || 'Unknown Teacher' },
        isFollowed: false,
      }));
      setAllCourses(formattedCourses);
    } catch (err) {
      console.error(`${action} action failed:`, err);
    }
  };

  return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400 mb-4">
            All Courses
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            View all courses on the platform.
          </p>
        </div>
        <div className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20">
          {loading ? (
              <p className="text-gray-300 text-center">Loading courses...</p>
          ) : error ? (
              <p className="text-red-400 text-center">{error}</p>
          ) : (
              <CourseList
                  role="instructor"
                  courses={allCourses}
                  onAction={handleCourseAction}
                  currentTeacher={localStorage.getItem('username') || 'teacher1'}
                  // ✅ ADDED: tells CourseList to build links inside the Teacher Dashboard
                  basePath="/teacherdashboard/all-courses"
              />
          )}
        </div>
      </div>
  );
};

export default AllCoursesTeacher;