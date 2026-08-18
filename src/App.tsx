import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import SubjectDetail from "./pages/SubjectDetail";
import Exams from "./pages/Exams";
import StudyPlan from "./pages/StudyPlan";
import StudyRoom from "./pages/StudyRoom";
import StudyHistory from "./pages/StudyHistory";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="subjects/:subjectId" element={<SubjectDetail />} />
              <Route path="exams" element={<Exams />} />
              <Route path="exams/:examId/plan" element={<StudyPlan />} />
              <Route path="study" element={<StudyRoom />} />
              <Route path="study-history" element={<StudyHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
