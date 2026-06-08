export default function Input({ label, helpText, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <input className={`form-control ${error ? 'is-invalid' : ''}`} {...props} />
      {helpText && <div className="form-text">{helpText}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  )
}

export function Textarea({ label, helpText, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <textarea className={`form-control ${error ? 'is-invalid' : ''}`} {...props} />
      {helpText && <div className="form-text">{helpText}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  )
}
