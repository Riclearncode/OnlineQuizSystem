export default function StatCard({ icon: Icon, label, tone = 'primary', value }) {
  return (
    <div className="stat-card p-4 d-flex align-items-center gap-3 h-100">
      <div className={`icon-box bg-${tone}-subtle text-${tone}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="min-w-0">
        <div className="text-muted small fw-semibold">{label}</div>
        <div className="fs-3 fw-bold text-slate-900">{value}</div>
      </div>
    </div>
  )
}
