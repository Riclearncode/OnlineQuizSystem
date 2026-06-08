import { AlertTriangle } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Button from './Button.jsx'
import Modal from './Modal.jsx'

export default function ConfirmDialog({
  confirmLabel,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title,
  variant = 'danger',
}) {
  const { t } = useI18n()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      title={title || t('confirmAction')}
      footer={(
        <>
          <Button variant="subtle" onClick={onCancel}>{t('cancel')}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel || t('confirm')}
          </Button>
        </>
      )}
    >
      <div className="d-flex gap-3">
        <div className="icon-box bg-danger-subtle text-danger flex-shrink-0">
          <AlertTriangle size={22} />
        </div>
        <p className="mb-0 text-muted">{message}</p>
      </div>
    </Modal>
  )
}
