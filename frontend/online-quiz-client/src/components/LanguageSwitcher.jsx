import { Languages } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="btn-group btn-group-sm" role="group" aria-label={t('language')}>
      <button
        type="button"
        className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1`}
        onClick={() => setLanguage('en')}
        title={t('english')}
      >
        <Languages size={15} />
        EN
      </button>
      <button
        type="button"
        className={`btn ${language === 'vi' ? 'btn-primary' : 'btn-outline-secondary'}`}
        onClick={() => setLanguage('vi')}
        title={t('vietnamese')}
      >
        VI
      </button>
    </div>
  )
}
