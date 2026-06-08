import { BookOpen, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Button from '../ui/Button.jsx'

export default function Sidebar({ links, onLogout }) {
  const { t } = useI18n()

  return (
    <aside className="sidebar text-white p-3 d-flex flex-column">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="icon-box bg-primary text-white">
          <BookOpen size={22} />
        </div>
        <div className="min-w-0">
          <div className="fw-bold text-truncate">{t('appName')}</div>
          <small className="text-slate-400">{t('appSubtitle')}</small>
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

      <div className="mt-auto pt-3">
        <Button className="w-100" icon={LogOut} onClick={onLogout} variant="subtle">
          {t('logout')}
        </Button>
      </div>
    </aside>
  )
}
