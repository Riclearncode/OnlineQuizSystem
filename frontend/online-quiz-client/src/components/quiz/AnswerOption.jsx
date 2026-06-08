export default function AnswerOption({ checked, name, onChange, option }) {
  return (
    <label className={`quiz-option p-3 d-flex gap-3 align-items-start ${checked ? 'selected' : ''}`}>
      <input
        checked={checked}
        className="form-check-input mt-1"
        name={name}
        onChange={onChange}
        type="radio"
      />
      <div>
        <div className="fw-bold">{option.label}</div>
      </div>
      <div className="flex-grow-1">{option.text}</div>
    </label>
  )
}
