export default function Card({ children, className = '' }) {
  return (
    <div className={`page-card ${className}`.trim()}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`d-flex flex-wrap justify-content-between align-items-start gap-3 ${className}`.trim()}>
      <div>
        <h2 className="h5 mb-1">{title}</h2>
        {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
