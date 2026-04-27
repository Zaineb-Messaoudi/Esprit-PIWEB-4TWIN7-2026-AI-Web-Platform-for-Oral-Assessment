import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CourseList from '../Components/CourseList';

const AllCoursesStudent = () => {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || '';

        const coursesResponse = await axios.get('http://localhost:3000/courses/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const coursesData = coursesResponse.data;

        const followedResponse = await axios.get('http://localhost:3000/courses/followed-courses/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const followedData = followedResponse.data;

        const followedIds = new Set(followedData.map(course => course.id));

        const formattedCourses = coursesData.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description,
          teacher: course.teacher && typeof course.teacher === 'object'
              ? course.teacher
              : { username: course.teacher || 'Unknown Teacher' },
          isFollowed: followedIds.has(course.id),
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

      if (action === 'follow') {
        await axios.post(`http://localhost:3000/courses/${courseId}/follow/`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (action === 'unfollow') {
        await axios.delete(`http://localhost:3000/courses/${courseId}/follow/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Refresh
      const updatedCoursesResponse = await axios.get('http://localhost:3000/courses/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const followedResponse = await axios.get('http://localhost:3000/courses/followed-courses/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const followedIds = new Set(followedResponse.data.map(course => course.id));
      const updatedFormattedCourses = updatedCoursesResponse.data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        teacher: course.teacher && typeof course.teacher === 'object'
            ? course.teacher
            : { username: course.teacher || 'Unknown Teacher' },
        isFollowed: followedIds.has(course.id),
      }));
      setAllCourses(updatedFormattedCourses);
    } catch (error) {
      console.error(`${action} action failed:`, error.message);
      setError(`Failed to ${action} course. Please try again.`);
    }
  };

  return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-gray-400 mb-4">
            Explore All Courses
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Browse all available courses and start learning something new today.
          </p>
        </div>
        <div className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20">
          {loading ? (
              <p className="text-gray-300 text-center">Loading courses...</p>
          ) : error ? (
              <p className="text-red-400 text-center">{error}</p>
          ) : (
              <CourseList
                  role="student"
                  courses={allCourses}
                  onAction={handleCourseAction}
                  // ✅ ADDED: tells CourseList to build links inside the Student Dashboard
                  basePath="/StudydDashboard/all-courses"
              />
          )}
        </div>
      </div>
  );
};

export default AllCoursesStudent;