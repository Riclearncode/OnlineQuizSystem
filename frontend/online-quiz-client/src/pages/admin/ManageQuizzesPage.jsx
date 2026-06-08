import { Edit, PlusCircle, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

const difficulties = ['Easy', 'Medium', 'Hard']
const emptyForm = {
  title: '',
  description: '',
  timeLimitMinutes: 25,
  totalQuestions: 10,
  isActive: true,
  topicIds: [],
  difficulties: ['Easy'],
}

export default function ManageQuizzesPage() {
  const { t } = useI18n()
  const [topics, setTopics] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadQuizzes() {
    const { data } = await api.get('/quizzes')
    setQuizzes(data)
  }

  useEffect(() => {
    async function load() {
      const [topicResponse] = await Promise.all([api.get('/topics'), loadQuizzes()])
      setTopics(topicResponse.data)
    }

    load()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const payload = {
      ...form,
      timeLimitMinutes: Number(form.timeLimitMinutes),
      totalQuestions: Number(form.totalQuestions),
      topicIds: form.topicIds.map(Number),
    }

    try {
      if (editingId) {
        await api.put(`/quizzes/${editingId}`, payload)
      } else {
        await api.post('/quizzes', payload)
      }
      resetForm()
      await loadQuizzes()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await api.delete(`/quizzes/${id}`)
      await loadQuizzes()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function toggleTopic(topicId) {
    const value = String(topicId)
    const topicIds = form.topicIds.includes(value)
      ? form.topicIds.filter((id) => id !== value)
      : [...form.topicIds, value]
    setForm({ ...form, topicIds })
  }

  function toggleDifficulty(difficulty) {
    const next = form.difficulties.includes(difficulty)
      ? form.difficulties.filter((item) => item !== difficulty)
      : [...form.difficulties, difficulty]
    setForm({ ...form, difficulties: next.length ? next : ['Easy'] })
  }

  function startEdit(quiz) {
    setEditingId(quiz.id)
    setForm({
      title: quiz.title,
      description: quiz.description || '',
      timeLimitMinutes: quiz.timeLimitMinutes,
      totalQuestions: quiz.totalQuestions,
      isActive: quiz.isActive,
      topicIds: [...new Set(quiz.questions.map((question) => String(question.topicId)))],
      difficulties: [...new Set(quiz.questions.map((question) => question.difficulty))],
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('manageQuizzes')} subtitle={t('manageQuizzesSubtitle')} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        <div className="col-xl-4">
          <form className="page-card p-3 vstack gap-3" onSubmit={handleSubmit}>
            <h2 className="h5 mb-0">{editingId ? t('editQuiz') : t('newQuiz')}</h2>
            <div>
              <label className="form-label">{t('title')}</label>
              <input className="form-control" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </div>
            <div>
              <label className="form-label">{t('description')}</label>
              <textarea className="form-control" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label">{t('timeLimit')}</label>
                <input className="form-control" type="number" min="1" value={form.timeLimitMinutes} onChange={(event) => setForm({ ...form, timeLimitMinutes: event.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">{t('questions')}</label>
                <input className="form-control" type="number" min="1" value={form.totalQuestions} onChange={(event) => setForm({ ...form, totalQuestions: event.target.value })} required />
              </div>
            </div>
            <div>
              <label className="form-label">{t('topics')}</label>
              <div className="d-flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <label className="btn btn-outline-secondary btn-sm" key={topic.id}>
                    <input className="form-check-input me-1" type="checkbox" checked={form.topicIds.includes(String(topic.id))} onChange={() => toggleTopic(topic.id)} />
                    {topic.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">{t('difficulty')}</label>
              <div className="d-flex gap-2">
                {difficulties.map((difficulty) => (
                  <label className="btn btn-outline-secondary btn-sm" key={difficulty}>
                    <input className="form-check-input me-1" type="checkbox" checked={form.difficulties.includes(difficulty)} onChange={() => toggleDifficulty(difficulty)} />
                    {t(difficulty)}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              <label className="form-check-label">{t('active')}</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary d-inline-flex align-items-center gap-2">
                {editingId ? <Save size={16} /> : <PlusCircle size={16} />}
                {editingId ? t('save') : t('create')}
              </button>
              {editingId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>{t('cancel')}</button>}
            </div>
          </form>
        </div>

        <div className="col-xl-8">
          <div className="page-card p-3">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>{t('quiz')}</th><th>{t('questions')}</th><th>{t('timeLimit')}</th><th>{t('status')}</th><th></th></tr></thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id}>
                      <td>
                        <div className="fw-semibold">{quiz.title}</div>
                        <small className="text-muted">{quiz.description}</small>
                      </td>
                      <td>{quiz.totalQuestions}</td>
                      <td>{t('minuteCount', { count: quiz.timeLimitMinutes })}</td>
                      <td><span className={`badge text-bg-${quiz.isActive ? 'success' : 'secondary'}`}>{quiz.isActive ? t('active') : t('inactive')}</span></td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-sm me-2" title={t('edit')} onClick={() => startEdit(quiz)}><Edit size={15} /></button>
                        <button className="btn btn-outline-danger btn-sm" title={t('delete')} onClick={() => handleDelete(quiz.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {quizzes.length === 0 && <tr><td colSpan="5" className="text-muted">{t('noQuizzesFound')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
