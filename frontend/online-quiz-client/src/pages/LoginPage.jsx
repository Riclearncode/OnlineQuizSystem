import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import Alert from '../components/ui/Alert.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
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
    <AuthLayout subtitle={t('authLoginSubtitle')} title={t('authLoginTitle')}>
      <Card className="p-4 p-md-5">
        <div className="mb-4">
          <h1 className="h3 fw-bold mb-1">{t('login')}</h1>
          <p className="text-muted mb-0">{t('assessmentPlatform')}</p>
        </div>

        <Alert>{error}</Alert>

        <form onSubmit={handleSubmit} className="vstack gap-3">
          <Input
            autoComplete="email"
            label={t('email')}
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <Input
            autoComplete="current-password"
            label={t('password')}
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          <Button className="w-100" disabled={loading} icon={LogIn} type="submit">
            {loading ? t('signingIn') : t('login')}
          </Button>
        </form>

        <div className="border-top mt-4 pt-3 small">
          {t('studentAccount')} <Link to="/register">{t('createOne')}</Link>
        </div>
      </Card>
    </AuthLayout>
  )
}
