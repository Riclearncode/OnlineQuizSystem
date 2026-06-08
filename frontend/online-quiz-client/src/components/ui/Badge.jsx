const variantClasses = {
  primary: 'text-bg-primary',
  success: 'text-bg-success',
  warning: 'text-bg-warning',
  danger: 'text-bg-danger',
  secondary: 'text-bg-secondary',
  light: 'text-bg-light',
  dark: 'text-bg-dark',
}

export default function Badge({ children, variant = 'secondary', className = '' }) {
  return (
    <span className={`badge ${variantClasses[variant] || variantClasses.secondary} ${className}`.trim()}>
      {children}
    </span>
  )
}

export function difficultyVariant(difficulty) {
  if (difficulty === 'Easy') return 'success'
  if (difficulty === 'Medium') return 'warning'
  if (difficulty === 'Hard') return 'danger'
  return 'secondary'
}

export function scoreVariant(score) {
  const value = Number(score)
  if (value >= 80) return 'success'
  if (value >= 50) return 'warning'
  return 'danger'
}
