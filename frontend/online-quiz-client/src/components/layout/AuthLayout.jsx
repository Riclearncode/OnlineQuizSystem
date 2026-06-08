import { BookOpen, CheckCircle2, ShieldCheck, Timer } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import LanguageSwitcher from '../LanguageSwitcher.jsx'

export default function AuthLayout({ children, subtitle, title }) {
  const { t } = useI18n()

  return (
    <div className="min-vh-100 row g-0">
      <section className="col-lg-6 auth-hero text-white d-flex align-items-center p-4 p-lg-5">
        <div className="max-w-xl">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="icon-box bg-white text-primary">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="h4 mb-0">{t('onlineQuizSystem')}</div>
              <div className="text-slate-300">{t('assessmentPlatform')}</div>
            </div>
          </div>

          <h1 className="display-6 fw-bold mb-3">{title}</h1>
          <p className="lead text-slate-200 mb-4">{subtitle}</p>

          <div className="row g-3">
            <Feature icon={ShieldCheck} label={t('roleBasedAccess')} />
            <Feature icon={Timer} label={t('timedAssessments')} />
            <Feature icon={CheckCircle2} label={t('autoGrading')} />
          </div>
        </div>
      </section>

      <section className="col-lg-6 d-flex align-items-center justify-content-center p-3 p-lg-5">
        <div className="auth-panel">
          <div className="d-flex justify-content-end mb-3">
            <LanguageSwitcher />
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}

function Feature({ icon: Icon, label }) {
  return (
    <div className="col-sm-4">
      <div className="bg-white bg-opacity-10 border border-white border-opacity-25 rounded-4 p-3 h-100">
        <Icon size={20} className="mb-2" />
        <div className="fw-semibold">{label}</div>
      </div>
    </div>
  )
}
