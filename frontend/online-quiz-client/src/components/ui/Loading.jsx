import { Loader2 } from 'lucide-react'
import Card from './Card.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function Loading({ text }) {
  const { t } = useI18n()

  return (
    <Card className="p-5 text-center text-muted">
      <Loader2 className="animate-spin mb-3 text-primary" size={30} />
      <div className="fw-semibold">{text || t('loading')}</div>
      <div className="placeholder-glow mt-3">
        <span className="placeholder col-5 rounded-pill" />
      </div>
    </Card>
  )
}
