import { BarChart3, BookOpen, ClipboardList, HelpCircle, History, LayoutDashboard, ListChecks, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

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
  const { t } = useI18n()
  const navigate = useNavigate()
  const links = user?.role === 'Admin' ? adminLinks : studentLinks

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell d-flex">
      <aside className="sidebar text-white p-3">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="bg-primary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className="fw-semibold">{t('appName')}</div>
            <small className="text-secondary">{t('appSubtitle')}</small>
          </div>
        </div>

        <nav className="nav flex-column gap-1">
          {links.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link px-3 py-2">
                <Icon size={18} />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <main className="content-area flex-grow-1">
        <header className="bg-white border-bottom px-4 py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="fw-semibold">{user?.fullName}</div>
            <small className="text-muted">{user?.role === 'Admin' ? t('roleAdmin') : t('roleStudent')} · {user?.email}</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitcher />
            <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" onClick={handleLogout}>
              <LogOut size={16} />
              {t('logout')}
            </button>
          </div>
        </header>
        <div className="container-fluid p-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
