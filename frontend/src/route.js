import { Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage';
import Signup from './Pages/signup';
import StudyDashboard from './Pages/StudyDashboard';
import TeacherDashboard from './Pages/TeacherDashboard';
import Assignments from './Pages/student/Assignments';
import AssignmentsTeacher from './Pages/teacher/AssignmentsTeacher';

export default function AppRoutes({ showWelcome, setShowWelcome }) {
  return (
    <Routes>
      <Route path="/" element={<LandingPage showWelcome={showWelcome} setShowWelcome={setShowWelcome} />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth" element={<AuthCallback />} />

      {/* Dashboard étudiant */}
      <Route path="/study/*" element={<StudyDashboard />}>
        <Route path="assignments" element={<Assignments />} />
      </Route>

      {/* Dashboard professeur */}
      <Route path="/teacher/*" element={<TeacherDashboard />}>
        <Route path="assignments" element={<AssignmentsTeacher />} />
      </Route>
    </Routes>
  );
}