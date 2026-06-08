import { LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import LanguageSwitcher from '../LanguageSwitcher.jsx'
import Button from '../ui/Button.jsx'

const titleKeys = [
  { path: '/admin/questions', key: 'manageQuestions' },
  { path: '/admin/topics', key: 'manageTopics' },
  { path: '/admin/quizzes', key: 'manageQuizzes' },
  { path: '/admin/attempts', key: 'attemptsStats' },
  { path: '/admin', key: 'adminDashboard' },
  { path: '/student/quizzes', key: 'activeQuizzes' },
  { path: '/student/history', key: 'attemptHistory' },
  { path: '/student/results', key: 'quizResult' },
  { path: '/student', key: 'studentDashboard' },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

export default function Topbar({ onLogout, user }) {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const titleKey = titleKeys.find((item) => pathname.startsWith(item.path))?.key || 'dashboard'

  return (
    <header className="bg-white border-bottom px-3 px-lg-4 py-3 d-flex flex-wrap justify-content-between align-items-center gap-3 sticky-top">
      <div>
        <div className="text-muted small fw-semibold">{user?.role === 'Admin' ? t('roleAdmin') : t('roleStudent')}</div>
        <h1 className="h4 mb-0">{t(titleKey)}</h1>
      </div>

      <div className="d-flex align-items-center gap-2">
        <LanguageSwitcher />
        <div className="d-none d-md-flex align-items-center gap-2 px-2">
          <div className="avatar">{getInitials(user?.fullName)}</div>
          <div className="lh-sm">
            <div className="fw-bold">{user?.fullName}</div>
            <small className="text-muted">{user?.email}</small>
          </div>
        </div>
        <Button icon={LogOut} onClick={onLogout} size="sm" variant="subtle">
          {t('logout')}
        </Button>
      </div>
    </header>
  )
}
