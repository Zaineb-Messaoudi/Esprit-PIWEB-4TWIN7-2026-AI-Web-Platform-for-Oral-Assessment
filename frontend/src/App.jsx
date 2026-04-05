// App.jsx
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from 'react';
import './index.css';
import './App.css';

// Pages & Components
import WelcomeScreen from './Pages/WelcomeScreen';
import Home from './Pages/Home';
import AuthPage from './Components/Auth';
import StudyDashboard from './Pages/StudyDashboard';
import CommunityDashboard from './Pages/CommunityDashboard';
import AdminManageTeachers from './Pages/AdminManageTeachers';
import AdminDashboard from './Pages/AdminDashboard';
import TeacherDashboard from './Pages/TeacherDashboard';
import ExamsQuizzes from './Pages/teacher-quiz/ExamsQuizzes';
import CreateQuiz from './Pages/teacher-quiz/CreateQuiz';
import EditQuiz from './Pages/teacher-quiz/EditQuiz';
import TeacherSettings from './Components/TeacherSettings';
import StudentSettings from './Components/StudentSettings';
import PlaceholderPage from './Components/PlaceholderPage';
import StudentResultPage from './Pages/student-quiz/QuizResults';
import StudyOverview from './Pages/StudyOverview';
import QuizList from './Pages/student-quiz/QuizList';
import QuizView from './Pages/student-quiz/QuizView';
import CourseDetails from './Pages/CourseDetails';
import ContentDetail from './Pages/ContentDetail';
import MyCoursesTeacher from './Pages/MyCoursesTeacher.jsx';
import MyCourses from './Pages/MyCourses.jsx';
import AllCoursesStudent from './Pages/AllCoursesStudent.jsx';
import AllCoursesTeacher from './Pages/AllCoursesTeacher.jsx';
import AdminManageStudents from './Pages/AdminManageStudents.jsx';
import LiveRecording from './Components/LiveRecording';

// Contexts
import { ThemeProvider } from "./context/ThemeContect";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { AccessibilityWidget } from "./Components/AccessibilityWidget";

function App() {
  const isOAuthCallback = window.location.pathname === '/auth/oauth-callback';
  const [showWelcome, setShowWelcome] = useState(!isOAuthCallback);

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <BrowserRouter>
          {showWelcome ? (
            <WelcomeScreen onLoadingComplete={() => setShowWelcome(false)} />
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/oauth-callback" element={<AuthPage />} />

              {/* Student Dashboard */}
              <Route path="/StudydDashboard" element={<StudyDashboard />}>
                <Route index element={<StudyOverview />} />
                <Route path="quizzes" element={<QuizList />} />
                <Route path="quizzes/:id" element={<QuizView />} />
                <Route path="quizzes/:id/result" element={<StudentResultPage />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="courses/:courseId" element={<CourseDetails />} />
                <Route path="courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                <Route path="all-courses" element={<AllCoursesStudent />} />
                <Route path="all-courses/:courseId" element={<CourseDetails />} />
                <Route path="all-courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                <Route path="settings" element={<StudentSettings />} />
                <Route path="live_classes" element={<LiveRecording classId="123" studentId="456" isInstructor={false} />} />
                <Route path="*" element={<PlaceholderPage title="Page Not Found" description="This section is under development" />} />
              </Route>

              {/* Teacher Dashboard */}
              <Route path="/teacherdashboard" element={<TeacherDashboard />}>
                <Route path="quizzes" element={<ExamsQuizzes />} />
                <Route path="quizzes/create" element={<CreateQuiz />} />
                <Route path="quizzes/edit/:id" element={<EditQuiz />} />
                <Route path="settings" element={<TeacherSettings />} />
                <Route path="courses" element={<MyCoursesTeacher />} />
                <Route path="courses/:courseId" element={<CourseDetails />} />
                <Route path="courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                <Route path="all-courses" element={<AllCoursesTeacher />} />
                <Route path="all-courses/:courseId" element={<CourseDetails />} />
                <Route path="all-courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                <Route path="live_classes" element={<LiveRecording classId="123" isInstructor={true} />} />
                <Route path="*" element={<PlaceholderPage title="Page Not Found" description="This section is under development" />} />
              </Route>

              {/* Admin Dashboard */}
              <Route path="/AdminDashboard" element={<AdminDashboard />}>
                <Route index element={<AdminDashboard />} />
                <Route path="AdminManagingStudents" element={<AdminManageStudents />} />
                <Route path="AdminManageTeachers" element={<AdminManageTeachers />} />
                <Route path="*" element={<PlaceholderPage title="Page Not Found" description="This section is under development" />} />
              </Route>

              {/* Fallback standalone routes */}
              <Route path="/courses/:courseId/" element={<CourseDetails />} />
              <Route path="/courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
            </Routes>
          )}
          <AccessibilityWidget position="bottom-right" />
        </BrowserRouter>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

export default App;