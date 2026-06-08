import { Inbox } from 'lucide-react'

export default function EmptyState({ action, compact = false, message, title }) {
  return (
    <div className={`text-center text-muted ${compact ? 'py-3' : 'page-card p-5'}`.trim()}>
      <div className="icon-box bg-light text-secondary mx-auto mb-3">
        <Inbox size={22} />
      </div>
      {title && <h2 className="h5 text-dark mb-1">{title}</h2>}
      <p className="mb-0">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
