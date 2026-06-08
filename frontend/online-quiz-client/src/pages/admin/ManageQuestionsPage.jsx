import { Edit, PlusCircle, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { difficultyBadge } from '../../utils/format.js'

const difficulties = ['Easy', 'Medium', 'Hard']
const emptyForm = {
  content: '',
  topicId: '',
  difficulty: 'Easy',
  explanation: '',
  correctOptionIndex: 0,
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
}

export default function ManageQuestionsPage() {
  const { t } = useI18n()
  const [topics, setTopics] = useState([])
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ search: '', topicId: '', difficulty: '' })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadQuestions(currentFilters = filters) {
    const params = new URLSearchParams()
    if (currentFilters.search) params.append('search', currentFilters.search)
    if (currentFilters.topicId) params.append('topicId', currentFilters.topicId)
    if (currentFilters.difficulty) params.append('difficulty', currentFilters.difficulty)
    const { data } = await api.get(`/questions?${params.toString()}`)
    setQuestions(data)
  }

  useEffect(() => {
    async function load() {
      const [topicResponse] = await Promise.all([api.get('/topics'), loadQuestions()])
      setTopics(topicResponse.data)
    }

    load()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const payload = { ...form, topicId: Number(form.topicId), correctOptionIndex: Number(form.correctOptionIndex) }

    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, payload)
      } else {
        await api.post('/questions', payload)
      }
      resetForm()
      await loadQuestions()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function applyFilters(event) {
    event.preventDefault()
    setError('')
    try {
      await loadQuestions(filters)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await api.delete(`/questions/${id}`)
      await loadQuestions()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function startEdit(question) {
    const options = question.options.map((option) => ({ label: option.label, text: option.text }))
    const correctOptionIndex = question.options.findIndex((option) => option.id === question.correctOptionId)
    setEditingId(question.id)
    setForm({
      content: question.content,
      topicId: String(question.topicId),
      difficulty: question.difficulty,
      explanation: question.explanation,
      options,
      correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function updateOption(index, text) {
    const options = form.options.map((option, optionIndex) => optionIndex === index ? { ...option, text } : option)
    setForm({ ...form, options })
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('manageQuestions')} subtitle={t('manageQuestionsSubtitle')} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        <div className="col-xl-4">
          <form className="page-card p-3 vstack gap-3" onSubmit={handleSubmit}>
            <h2 className="h5 mb-0">{editingId ? t('editQuestion') : t('newQuestion')}</h2>
            <div>
              <label className="form-label">{t('content')}</label>
              <textarea className="form-control" rows="4" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
            </div>
            <div className="row g-2">
              <div className="col-md-7">
                <label className="form-label">{t('topic')}</label>
                <select className="form-select" value={form.topicId} onChange={(event) => setForm({ ...form, topicId: event.target.value })} required>
                  <option value="">{t('selectTopic')}</option>
                  {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                </select>
              </div>
              <div className="col-md-5">
                <label className="form-label">{t('difficulty')}</label>
                <select className="form-select" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
                  {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{t(difficulty)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">{t('options')}</label>
              <div className="vstack gap-2">
                {form.options.map((option, index) => (
                  <div className="input-group" key={option.label}>
                    <span className="input-group-text">{option.label}</span>
                    <input className="form-control" value={option.text} onChange={(event) => updateOption(index, event.target.value)} required />
                    <span className="input-group-text">
                      <input type="radio" name="correctOption" checked={Number(form.correctOptionIndex) === index} onChange={() => setForm({ ...form, correctOptionIndex: index })} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">{t('explanation')}</label>
              <textarea className="form-control" rows="3" value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} required />
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
          <div className="page-card p-3 mb-3">
            <form className="row g-2" onSubmit={applyFilters}>
              <div className="col-md-5"><input className="form-control" placeholder={t('searchContent')} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></div>
              <div className="col-md-3">
                <select className="form-select" value={filters.topicId} onChange={(event) => setFilters({ ...filters, topicId: event.target.value })}>
                  <option value="">{t('allTopics')}</option>
                  {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select" value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}>
                  <option value="">{t('all')}</option>
                  {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{t(difficulty)}</option>)}
                </select>
              </div>
              <div className="col-md-2"><button className="btn btn-outline-primary w-100">{t('filter')}</button></div>
            </form>
          </div>

          <div className="page-card p-3">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>{t('questions')}</th><th>{t('topic')}</th><th>{t('difficulty')}</th><th></th></tr></thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td className="line-clamp-2">{question.content}</td>
                      <td>{question.topicName}</td>
                      <td><span className={`badge text-bg-${difficultyBadge(question.difficulty)}`}>{t(question.difficulty)}</span></td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-sm me-2" title={t('edit')} onClick={() => startEdit(question)}><Edit size={15} /></button>
                        <button className="btn btn-outline-danger btn-sm" title={t('delete')} onClick={() => handleDelete(question.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {questions.length === 0 && <tr><td colSpan="4" className="text-muted">{t('noQuestionsFound')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
