import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from 'react';
import './index.css';
import { AnimatePresence } from 'framer-motion';

import WelcomeScreen from './Pages/WelcomeScreen';
import Home from './Pages/Home';
import AuthPage from './Components/Auth';

// Dashboards
import StudyDashboard from './Pages/StudyDashboard';
import CommunityDashboard from './Pages/CommunityDashboard';
import TeacherDashboard from './Pages/TeacherDashboard';
import AdminDashboard from './Pages/AdminDashboard';

// Student pages
import StudyOverview from './Pages/StudyOverview';
import QuizList from './Pages/student-quiz/QuizList';
import QuizView from './Pages/student-quiz/QuizView';
import StudentResultPage from './Pages/student-quiz/QuizResults';
import MyCourses from './Pages/MyCourses.jsx';
import AllCoursesStudent from './Pages/AllCoursesStudent.jsx';

// Courses shared
import CourseDetails from './Pages/CourseDetails';
import ContentDetail from './Pages/ContentDetail';

// Teacher
import ExamsQuizzes from './Pages/teacher-quiz/ExamsQuizzes';
import CreateQuiz from './Pages/teacher-quiz/CreateQuiz';
import EditQuiz from './Pages/teacher-quiz/EditQuiz';
import MyCoursesTeacher from './Pages/MyCoursesTeacher.jsx';
import AllCoursesTeacher from './Pages/AllCoursesTeacher.jsx';
import TeacherSettings from './Components/TeacherSettings';

// Admin
import AdminManageTeachers from './Pages/AdminManageTeachers';
import AdminManageStudents from './Pages/AdminManageStudents.jsx';

// Forum (IMPORTANT)
import Forum from "./Pages/ForumPage.jsx";


// Utils
import PlaceholderPage from './Components/PlaceholderPage';

// Theme
import { ThemeProvider } from "@/context/ThemeContect.jsx";
import ForumPage from './Pages/ForumPage.jsx';

function App() {
    const [showWelcome, setShowWelcome] = useState(true);

    return (
        <ThemeProvider>
            <BrowserRouter>
                <AnimatePresence mode="wait">
                    {showWelcome ? (
                        <WelcomeScreen onLoadingComplete={() => setShowWelcome(false)} />
                    ) : (
                        <Routes>

                            {/* ───── HOME ───── */}
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/auth" element={<AuthPage />} />
                        <Route path="/student/forum" element={<ForumPage />} />

                            

                            {/* ───── STUDENT DASHBOARD ───── */}
                            <Route path="/student" element={<StudyDashboard />}>
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
                                


        

                                <Route path="settings" element={<PlaceholderPage title="Settings" description="Student settings" />} />
                                <Route path="*" element={<PlaceholderPage title="Not Found" description="Page not found" />} />
                            </Route>

                            {/* ───── COMMUNITY ───── */}
                            <Route path="/community" element={<CommunityDashboard />} />

                            {/* ───── TEACHER ───── */}
                            <Route path="/teacher" element={<TeacherDashboard />}>
                                <Route index element={<div />} />

                                <Route path="quizzes" element={<ExamsQuizzes />} />
                                <Route path="quizzes/create" element={<CreateQuiz />} />
                                <Route path="quizzes/edit/:id" element={<EditQuiz />} />

                                <Route path="courses" element={<MyCoursesTeacher />} />
                                <Route path="all-courses" element={<AllCoursesTeacher />} />

                                <Route path="courses/:courseId" element={<CourseDetails />} />
                                <Route path="courses/:courseId/chapters/:chapterId/contents/:contentId" element={<ContentDetail />} />

                                <Route path="settings" element={<TeacherSettings />} />
                            </Route>

                            {/* ───── ADMIN ───── */}
                            <Route path="/admin" element={<AdminDashboard />}>
                                <Route index element={<AdminDashboard />} />
                                <Route path="students" element={<AdminManageStudents />} />
                                <Route path="teachers" element={<AdminManageTeachers />} />
                            </Route>

                            {/* fallback */}
                            <Route path="*" element={<PlaceholderPage title="404" description="Page not found" />} />

                        </Routes>
                    )}
                </AnimatePresence>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;