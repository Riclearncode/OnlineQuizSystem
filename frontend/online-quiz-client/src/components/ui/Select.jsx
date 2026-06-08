export default function Select({ label, children, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <select className={`form-select ${error ? 'is-invalid' : ''}`} {...props}>
        {children}
      </select>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  )
}
