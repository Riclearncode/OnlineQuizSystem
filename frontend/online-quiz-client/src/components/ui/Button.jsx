const variantClasses = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  outline: 'btn btn-outline-primary',
  subtle: 'btn btn-light border',
  danger: 'btn btn-danger',
  dangerOutline: 'btn btn-outline-danger',
  ghost: 'btn btn-link text-decoration-none',
}

const sizeClasses = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export default function Button({
  children,
  className = '',
  icon: Icon,
  size = 'md',
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button
      className={`${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || ''} d-inline-flex align-items-center justify-content-center gap-2 ${className}`.trim()}
      type={type}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 18} />}
      {children}
    </button>
  )
}
