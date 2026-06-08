import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const variantClasses = {
  danger: 'alert-danger',
  success: 'alert-success',
  info: 'alert-info',
  warning: 'alert-warning',
}

const icons = {
  danger: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertCircle,
}

export default function Alert({ children, variant = 'danger', className = '' }) {
  const Icon = icons[variant] || AlertCircle

  if (!children) return null

  return (
    <div className={`alert ${variantClasses[variant] || variantClasses.danger} d-flex align-items-start gap-2 ${className}`.trim()} role="alert">
      <Icon size={18} className="mt-1 flex-shrink-0" />
      <div>{children}</div>
    </div>
  )
}
