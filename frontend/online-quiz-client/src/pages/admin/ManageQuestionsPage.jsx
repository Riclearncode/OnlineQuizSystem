import { Edit, PlusCircle, Save, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge, { difficultyVariant } from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { Textarea } from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Select from '../../components/ui/Select.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

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
  const { language, t } = useI18n()
  const [topics, setTopics] = useState([])
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ search: '', topicId: '', difficulty: '' })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadQuestions = useCallback(async (currentFilters) => {
    const params = new URLSearchParams()
    if (currentFilters.search) params.append('search', currentFilters.search)
    if (currentFilters.topicId) params.append('topicId', currentFilters.topicId)
    if (currentFilters.difficulty) params.append('difficulty', currentFilters.difficulty)
    const { data } = await api.get(`/questions?${params.toString()}`)
    setQuestions(data)
  }, [])

  useEffect(() => {
    async function load() {
      const [topicResponse] = await Promise.all([api.get('/topics'), loadQuestions({ search: '', topicId: '', difficulty: '' })])
      setTopics(topicResponse.data)
    }

    load()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [loadQuestions])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
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
    setModalOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(false)
  }

  function updateOption(index, text) {
    const options = form.options.map((option, optionIndex) => optionIndex === index ? { ...option, text } : option)
    setForm({ ...form, options })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const payload = { ...form, topicId: Number(form.topicId), correctOptionIndex: Number(form.correctOptionIndex) }

    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, payload)
      } else {
        await api.post('/questions', payload)
      }
      resetForm()
      await loadQuestions(filters)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
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

  async function confirmDelete() {
    if (!deleteTarget) return

    setError('')
    try {
      await api.delete(`/questions/${deleteTarget.id}`)
      setDeleteTarget(null)
      await loadQuestions(filters)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader
        title={t('manageQuestions')}
        subtitle={t('manageQuestionsSubtitle')}
        action={<Button icon={PlusCircle} onClick={openCreate}>{t('addQuestion')}</Button>}
      />
      <Alert>{error}</Alert>

      <Card className="p-4 mb-3">
        <form className="row g-2 align-items-end" onSubmit={applyFilters}>
          <div className="col-lg-5">
            <label className="form-label">{t('searchContent')}</label>
            <div className="input-group">
              <span className="input-group-text"><Search size={16} /></span>
              <input className="form-control" placeholder={t('searchContent')} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            </div>
          </div>
          <Select className="col-lg-3" label={t('topic')} value={filters.topicId} onChange={(event) => setFilters({ ...filters, topicId: event.target.value })}>
            <option value="">{t('allTopics')}</option>
            {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
          </Select>
          <Select className="col-lg-2" label={t('difficulty')} value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}>
            <option value="">{t('all')}</option>
            {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{t(difficulty)}</option>)}
          </Select>
          <div className="col-lg-2">
            <Button className="w-100" type="submit" variant="outline">{t('filter')}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>{t('questions')}</th>
                <th>{t('topic')}</th>
                <th>{t('difficulty')}</th>
                <th>{t('createdAt')}</th>
                <th className="text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td className="fw-semibold"><span className="line-clamp-2">{question.content}</span></td>
                  <td>{question.topicName}</td>
                  <td><Badge variant={difficultyVariant(question.difficulty)}>{t(question.difficulty)}</Badge></td>
                  <td>{formatDate(question.createdAt, language)}</td>
                  <td className="text-end">
                    <Button className="me-2" icon={Edit} onClick={() => startEdit(question)} size="sm" variant="outline">{t('edit')}</Button>
                    <Button icon={Trash2} onClick={() => setDeleteTarget(question)} size="sm" variant="dangerOutline">{t('delete')}</Button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <EmptyState compact message={t('noQuestionsFound')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={resetForm}
        title={editingId ? t('editQuestion') : t('newQuestion')}
        footer={(
          <>
            <Button variant="subtle" onClick={resetForm}>{t('cancel')}</Button>
            <Button disabled={saving} form="question-form" icon={editingId ? Save : PlusCircle} type="submit">
              {saving ? t('creating') : editingId ? t('save') : t('create')}
            </Button>
          </>
        )}
      >
        <form className="vstack gap-3" id="question-form" onSubmit={handleSubmit}>
          <Textarea
            label={t('content')}
            rows="4"
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            required
          />
          <div className="row g-2">
            <Select className="col-md-7" label={t('topic')} value={form.topicId} onChange={(event) => setForm({ ...form, topicId: event.target.value })} required>
              <option value="">{t('selectTopic')}</option>
              {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </Select>
            <Select className="col-md-5" label={t('difficulty')} value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{t(difficulty)}</option>)}
            </Select>
          </div>
          <div>
            <label className="form-label">{t('options')}</label>
            <div className="vstack gap-2">
              {form.options.map((option, index) => (
                <div className="input-group" key={option.label}>
                  <span className="input-group-text fw-bold">{option.label}</span>
                  <input className="form-control" value={option.text} onChange={(event) => updateOption(index, event.target.value)} required />
                  <span className="input-group-text">
                    <input type="radio" name="correctOption" checked={Number(form.correctOptionIndex) === index} onChange={() => setForm({ ...form, correctOptionIndex: index })} />
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Textarea
            label={t('explanation')}
            rows="3"
            value={form.explanation}
            onChange={(event) => setForm({ ...form, explanation: event.target.value })}
            required
          />
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel={t('delete')}
        isOpen={Boolean(deleteTarget)}
        message={t('deleteQuestionMessage')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('deleteQuestionTitle')}
      />
    </>
  )
}
