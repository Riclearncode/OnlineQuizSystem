import { X } from 'lucide-react'
import Button from './Button.jsx'
import Card from './Card.jsx'

export default function Modal({ children, footer, isOpen, onClose, size = 'lg', title }) {
  if (!isOpen) return null

  return (
    <>
      <div className="modal-backdrop-custom" onClick={onClose} />
      <div className="modal-panel-custom">
        <Card className={`modal-card-custom w-100 ${size === 'sm' ? 'max-w-md' : 'max-w-3xl'}`}>
          <div className="modal-header-custom d-flex justify-content-between align-items-center gap-3 border-bottom p-4">
            <h2 className="h5 mb-0">{title}</h2>
            <Button variant="subtle" size="sm" icon={X} onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body-custom p-4">
            {children}
          </div>
          {footer && <div className="modal-footer-custom border-top p-4 d-flex justify-content-end gap-2">{footer}</div>}
        </Card>
      </div>
    </>
  )
}
