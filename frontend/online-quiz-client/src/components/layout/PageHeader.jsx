export default function PageHeader({ action, eyebrow, subtitle, title }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        {eyebrow && <div className="text-primary small fw-bold text-uppercase mb-1">{eyebrow}</div>}
        <h1 className="display-6 fw-bold mb-1">{title}</h1>
        {subtitle && <p className="text-muted mb-0 fs-5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
