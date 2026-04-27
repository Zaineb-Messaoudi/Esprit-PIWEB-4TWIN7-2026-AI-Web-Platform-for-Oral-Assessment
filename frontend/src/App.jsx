import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from 'react';
import './index.css';
import WelcomeScreen from './Pages/WelcomeScreen';
import Home from './Pages/Home';
import ProtectedRoute from './ProtectedRoute';
import { AnimatePresence } from 'framer-motion';
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
import StudentSubmissionHistory from './Pages/StudentSubmissionHistory.jsx';
import TeacherSubmissions from './Pages/TeacherSubmissions.jsx';
import { ThemeProvider } from "@/context/ThemeContect.jsx";
import OAuthCallback from './Pages/OAuthCallback.jsx';
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AccessibilityWidget } from "@/Components/AccessibilityWidget";
import ClassManagement from './Components/ClassManagement';
import StudentClasses from './Components/StudentClasses';
import AdminClassManagement from './Components/Adminclassmanagement.jsx';
import Assignments from './Pages/student/Assignments.jsx';
import AssignmentsTeacher from './Pages/teacher/AssignmentsTeacher.jsx';
import AuthCallback from './Pages/AuthCallback.jsx';
import CompleteProfile from './Pages/CompleteProfile.jsx';
import Sessions from './Pages/teacher/Sessions.jsx';
import MySession from './Pages/student/MySession.jsx';
import StudentSubmissionDetail from './Pages/Studentsubmissiondetail.jsx';
import SubmissionDetail from './Pages/Submissiondetail.jsx';
import RubricManagement from './Pages/teacher/RubricManagement';


function App() {
  const isOAuthCallback = window.location.pathname === '/auth/oauth-callback';
  const [showWelcome, setShowWelcome] = useState(!isOAuthCallback);

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <BrowserRouter>
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <WelcomeScreen onLoadingComplete={() => setShowWelcome(false)} />
            ) : (
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/oauth-callback" element={<AuthCallback />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />


                {/* ─── Student Dashboard ─────────────────────────────────────── */}
                <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
                  <Route path="/StudydDashboard" element={<StudyDashboard />}>
                    <Route index element={<StudyOverview />} />
                    <Route path="quizzes" element={<QuizList />} />
                    <Route path="quizzes/:id" element={<QuizView />} />
                    <Route path="quizzes/:id/result" element={<StudentResultPage />} />
                    <Route path="sessions" element={<MySession />} />
                    <Route path="courses" element={<MyCourses />} />
                    <Route path="courses/:courseId" element={<CourseDetails />} />
                    <Route path="courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                    <Route path="all-courses" element={<AllCoursesStudent />} />
                    <Route path="all-courses/:courseId" element={<CourseDetails />} />
                    <Route path="all-courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                    <Route path="classes" element={<StudentClasses />} />
                    <Route path="settings" element={<StudentSettings />} />
                    <Route path="submissionshistory" element={<StudentSubmissionHistory />} />
                    <Route path="submissionshistory/:id" element={<StudentSubmissionDetail />} />
                    <Route path="assignments" element={<Assignments />} />
                    <Route path="schedule" element={<PlaceholderPage title="Schedule" description="Daily/weekly schedule" />} />
                    <Route path="*" element={<PlaceholderPage title="Page Not Found" description="Under development" />} />
                  </Route>
                </Route>

                {/* ─── Community ─────────────────────────────────────────────── */}
                <Route path="/community" element={<CommunityDashboard />} />

                {/* ─── Teacher Dashboard ─────────────────────────────────────── */}
                <Route element={<ProtectedRoute allowedRoles={["instructor"]} />}>
                  <Route path="/teacherdashboard" element={<TeacherDashboard />}>
                    <Route index element={<div className="p-4 text-2xl font-bold text-red-500">Welcome to Teacher Dashboard</div>} />
                    <Route path="overview" element={<div />} />
                    <Route path="sessions" element={<Sessions />} />
                    <Route path="quizzes" element={<ExamsQuizzes />} />
                    <Route path="quizzes/create" element={<CreateQuiz />} />
                    <Route path="quizzes/edit/:id" element={<EditQuiz />} />
                    <Route path="assignments" element={<AssignmentsTeacher />} />
                    <Route path="rubrics" element={<RubricManagement />} /> 
                    <Route path="settings" element={<TeacherSettings />} />
                    <Route path="courses" element={<MyCoursesTeacher />} />
                    <Route path="courses/:courseId" element={<CourseDetails />} />
                    <Route path="courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                    <Route path="all-courses" element={<AllCoursesTeacher />} />
                    <Route path="all-courses/:courseId" element={<CourseDetails />} />
                    <Route path="all-courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
                    <Route path="classes" element={<ClassManagement />} />
                    <Route path="submissions" element={<TeacherSubmissions />} />
                    <Route path="submissions/:id" element={<SubmissionDetail />} />
                    <Route path="attendance" element={<PlaceholderPage title="Attendance" description="Track student attendance" />} />
                    <Route path="analytics" element={<PlaceholderPage title="Analytics" description="Student performance analytics" />} />
                    <Route path="schedule" element={<PlaceholderPage title="Class Schedule" description="Manage your teaching schedule" />} />
                    <Route path="content" element={<PlaceholderPage title="Content Library" description="Course materials and resources" />} />
                    <Route path="live_classes" element={<PlaceholderPage title="Live Classes" description="Conduct virtual classes" />} />
                    <Route path="forums" element={<PlaceholderPage title="Discussion Forums" description="Moderate class discussions" />} />
                    <Route path="notifications" element={<PlaceholderPage title="Notifications" description="System alerts and updates" />} />
                    <Route path="support" element={<PlaceholderPage title="Support" description="Get help and report issues" />} />
                    <Route path="*" element={<PlaceholderPage title="Page Not Found" description="Under development" />} />
                  </Route>
                </Route>

                {/* ─── Admin Dashboard ───────────────────────────────────────── */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/AdminDashboard" element={<AdminDashboard />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="overview" element={<AdminDashboard />} />
                    <Route path="AdminManagingStudents" element={<AdminManageStudents />} />
                    <Route path="AdminManageTeachers" element={<AdminManageTeachers />} />
                    <Route path="classes" element={<AdminClassManagement />} />
                    <Route path="*" element={<PlaceholderPage title="Page Not Found" description="Under development" />} />
                  </Route>
                </Route>

                {/* ─── Standalone fallback ───────────────────────────────────── */}
                <Route path="/courses/:courseId/" element={<CourseDetails />} />
                <Route path="/courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />
              </Routes>
            )}
          </AnimatePresence>
          <AccessibilityWidget position="bottom-right" />
        </BrowserRouter>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

export default App;