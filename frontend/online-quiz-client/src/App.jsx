import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './components/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import ActiveQuizzesPage from './pages/student/ActiveQuizzesPage.jsx'
import TakeQuizPage from './pages/student/TakeQuizPage.jsx'
import QuizResultPage from './pages/student/QuizResultPage.jsx'
import AttemptHistoryPage from './pages/student/AttemptHistoryPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import ManageTopicsPage from './pages/admin/ManageTopicsPage.jsx'
import ManageQuestionsPage from './pages/admin/ManageQuestionsPage.jsx'
import ManageQuizzesPage from './pages/admin/ManageQuizzesPage.jsx'
import AdminAttemptsPage from './pages/admin/AdminAttemptsPage.jsx'
import { I18nProvider } from './i18n/I18nContext.jsx'

function HomeRedirect() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return user.role === 'Admin'
    ? <Navigate to="/admin" replace />
    : <Navigate to="/student" replace />
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['Student']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="quizzes" element={<ActiveQuizzesPage />} />
            <Route path="quizzes/:quizId/take" element={<TakeQuizPage />} />
            <Route path="results/:attemptId" element={<QuizResultPage />} />
            <Route path="history" element={<AttemptHistoryPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="topics" element={<ManageTopicsPage />} />
            <Route path="questions" element={<ManageQuestionsPage />} />
            <Route path="quizzes" element={<ManageQuizzesPage />} />
            <Route path="attempts" element={<AdminAttemptsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </I18nProvider>
  )
}
