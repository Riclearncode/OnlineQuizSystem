import { useI18n } from '../i18n/I18nContext.jsx'

export default function LoadingState({ text }) {
  const { t } = useI18n()

  return (
    <div className="page-card p-4 text-center text-muted">
      <div className="spinner-border spinner-border-sm me-2" />
      {text || t('loading')}
    </div>
  )
}
