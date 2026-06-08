import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import AuthLayout from '../components/layout/AuthLayout.jsx'
import Alert from '../components/ui/Alert.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
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
    <AuthLayout subtitle={t('authRegisterSubtitle')} title={t('authRegisterTitle')}>
      <Card className="p-4 p-md-5">
        <div className="mb-4">
          <h1 className="h3 fw-bold mb-1">{t('createAccount')}</h1>
          <p className="text-muted mb-0">{t('registerSubtitle')}</p>
        </div>

        <Alert>{error}</Alert>

        <form onSubmit={handleSubmit} className="vstack gap-3">
          <Input
            autoComplete="name"
            label={t('fullName')}
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            required
          />
          <Input
            autoComplete="email"
            label={t('email')}
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <Input
            autoComplete="new-password"
            helpText={t('passwordHint')}
            label={t('password')}
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          <Button className="w-100" disabled={loading} icon={UserPlus} type="submit">
            {loading ? t('creating') : t('register')}
          </Button>
        </form>

        <div className="border-top mt-4 pt-3 small">
          {t('alreadyHaveAccount')} <Link to="/login">{t('login')}</Link>
        </div>
      </Card>
    </AuthLayout>
  )
}
