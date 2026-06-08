import { BookOpen } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: 'admin@quiz.com', password: 'Admin@123' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const auth = await login(form)
      navigate(location.state?.from || (auth.role === 'Admin' ? '/admin' : '/student'), { replace: true })
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
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="bg-primary text-white rounded-2 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="h4 mb-0">{t('onlineQuizSystem')}</h1>
            <small className="text-muted">Data Structures and Algorithms</small>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="vstack gap-3">
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
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? t('signingIn') : t('login')}
          </button>
        </form>

        <div className="border-top mt-4 pt-3 small text-muted">
          {t('defaultAdmin')}: <strong>admin@quiz.com</strong> / <strong>Admin@123</strong>
          <br />
          {t('studentAccount')} <Link to="/register">{t('createOne')}</Link>
        </div>
      </div>
    </div>
  )
}
