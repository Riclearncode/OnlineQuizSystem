import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/student', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="auth-panel page-card p-4">
        <div className="d-flex justify-content-end mb-3">
          <LanguageSwitcher />
        </div>
        <h1 className="h4 mb-1">{t('createAccount')}</h1>
        <p className="text-muted mb-4">{t('registerSubtitle')}</p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="vstack gap-3">
          <div>
            <label className="form-label">{t('fullName')}</label>
            <input
              className="form-control"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">{t('email')}</label>
            <input
              className="form-control"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">{t('password')}</label>
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <div className="form-text">{t('passwordHint')}</div>
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? t('creating') : t('register')}
          </button>
        </form>

        <div className="border-top mt-4 pt-3 small">
          {t('alreadyHaveAccount')} <Link to="/login">{t('login')}</Link>
        </div>
      </div>
    </div>
  )
}
