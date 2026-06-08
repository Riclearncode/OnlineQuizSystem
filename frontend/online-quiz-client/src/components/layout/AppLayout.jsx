import { BarChart3, BookOpen, ClipboardList, HelpCircle, History, LayoutDashboard, ListChecks } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const studentLinks = [
  { to: '/student', labelKey: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/quizzes', labelKey: 'activeQuizzes', icon: ListChecks },
  { to: '/student/history', labelKey: 'myHistory', icon: History },
]

const adminLinks = [
  { to: '/admin', labelKey: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/topics', labelKey: 'topics', icon: BookOpen },
  { to: '/admin/questions', labelKey: 'questions', icon: HelpCircle },
  { to: '/admin/quizzes', labelKey: 'quizzes', icon: ClipboardList },
  { to: '/admin/attempts', labelKey: 'attempts', icon: BarChart3 },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user?.role === 'Admin' ? adminLinks : studentLinks

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell d-flex">
      <Sidebar links={links} onLogout={handleLogout} />
      <main className="content-area flex-grow-1">
        <Topbar onLogout={handleLogout} user={user} />
        <div className="container-fluid p-4 p-xl-5">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
