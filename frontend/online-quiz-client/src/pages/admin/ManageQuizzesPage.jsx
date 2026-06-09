import { Clock, Edit, FileUp, PlusCircle, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Input, { Textarea } from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

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

const emptyImportForm = {
  title: '',
  description: '',
  timeLimitMinutes: 25,
  isActive: true,
  file: null,
  rawText: '',
}

export default function ManageQuizzesPage() {
  const { language, t } = useI18n()
  const [topics, setTopics] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [importForm, setImportForm] = useState(emptyImportForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openImport() {
    setImportForm(emptyImportForm)
    setImportModalOpen(true)
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
    setModalOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(false)
  }

  function resetImportForm() {
    setImportForm(emptyImportForm)
    setImportModalOpen(false)
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

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
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
    } finally {
      setSaving(false)
    }
  }

  async function handleImportSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!importForm.file && !importForm.rawText.trim()) {
      setError(t('pasteStandardForm'))
      return
    }

    setImporting(true)
    const formData = new FormData()
    formData.append('title', importForm.title)
    formData.append('description', importForm.description || '')
    formData.append('timeLimitMinutes', String(importForm.timeLimitMinutes))
    formData.append('isActive', String(importForm.isActive))
    if (importForm.file) {
      formData.append('file', importForm.file)
    }
    if (importForm.rawText.trim()) {
      formData.append('rawText', importForm.rawText)
    }

    try {
      const { data } = await api.post('/quizzes/import', formData)
      resetImportForm()
      await loadQuizzes()
      setSuccess(t('importSuccess', {
        title: data.quiz.title,
        created: data.createdQuestionCount,
        reused: data.reusedQuestionCount,
        topics: data.createdTopicCount,
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setImporting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setError('')
    try {
      await api.delete(`/quizzes/${deleteTarget.id}`)
      setDeleteTarget(null)
      await loadQuizzes()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader
        title={t('manageQuizzes')}
        subtitle={t('manageQuizzesSubtitle')}
        action={(
          <div className="d-flex flex-wrap gap-2">
            <Button icon={FileUp} onClick={openImport} variant="outline">{t('importQuiz')}</Button>
            <Button icon={PlusCircle} onClick={openCreate}>{t('createQuiz')}</Button>
          </div>
        )}
      />
      <Alert>{error}</Alert>
      <Alert variant="success">{success}</Alert>

      <ImportFormatGuide t={t} />

      <Card className="p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>{t('quiz')}</th>
                <th>{t('questions')}</th>
                <th>{t('timeLimit')}</th>
                <th>{t('status')}</th>
                <th>{t('createdAt')}</th>
                <th className="text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <div className="fw-bold">{quiz.title}</div>
                    <small className="text-muted line-clamp-2">{quiz.description}</small>
                  </td>
                  <td>{quiz.totalQuestions}</td>
                  <td><span className="d-inline-flex align-items-center gap-1"><Clock size={15} /> {t('minuteCount', { count: quiz.timeLimitMinutes })}</span></td>
                  <td><Badge variant={quiz.isActive ? 'success' : 'secondary'}>{quiz.isActive ? t('active') : t('inactive')}</Badge></td>
                  <td>{formatDate(quiz.createdAt, language)}</td>
                  <td className="text-end">
                    <Button className="me-2" icon={Edit} onClick={() => startEdit(quiz)} size="sm" variant="outline">{t('edit')}</Button>
                    <Button icon={Trash2} onClick={() => setDeleteTarget(quiz)} size="sm" variant="dangerOutline">{t('delete')}</Button>
                  </td>
                </tr>
              ))}
              {quizzes.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <EmptyState compact message={t('noQuizzesFound')} />
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
        title={editingId ? t('editQuiz') : t('newQuiz')}
        footer={(
          <>
            <Button variant="subtle" onClick={resetForm}>{t('cancel')}</Button>
            <Button disabled={saving} form="quiz-form" icon={editingId ? Save : PlusCircle} type="submit">
              {saving ? t('creating') : editingId ? t('save') : t('create')}
            </Button>
          </>
        )}
      >
        <form className="vstack gap-3" id="quiz-form" onSubmit={handleSubmit}>
          <Input
            label={t('title')}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <Textarea
            label={t('description')}
            rows="3"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="row g-2">
            <Input
              className="col-md-6"
              label={t('timeLimit')}
              min="1"
              type="number"
              value={form.timeLimitMinutes}
              onChange={(event) => setForm({ ...form, timeLimitMinutes: event.target.value })}
              required
            />
            <Input
              className="col-md-6"
              label={t('questions')}
              min="1"
              type="number"
              value={form.totalQuestions}
              onChange={(event) => setForm({ ...form, totalQuestions: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">{t('topics')}</label>
            <div className="d-flex flex-wrap gap-2">
              {topics.map((topic) => (
                <label className={`btn btn-sm ${form.topicIds.includes(String(topic.id)) ? 'btn-primary' : 'btn-outline-secondary'}`} key={topic.id}>
                  <input className="form-check-input me-1" type="checkbox" checked={form.topicIds.includes(String(topic.id))} onChange={() => toggleTopic(topic.id)} />
                  {topic.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">{t('difficulty')}</label>
            <div className="d-flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <label className={`btn btn-sm ${form.difficulties.includes(difficulty) ? 'btn-primary' : 'btn-outline-secondary'}`} key={difficulty}>
                  <input className="form-check-input me-1" type="checkbox" checked={form.difficulties.includes(difficulty)} onChange={() => toggleDifficulty(difficulty)} />
                  {t(difficulty)}
                </label>
              ))}
            </div>
          </div>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            <label className="form-check-label fw-semibold">{t('active')}</label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={importModalOpen}
        onClose={resetImportForm}
        title={t('importQuizTitle')}
        footer={(
          <>
            <Button variant="subtle" onClick={resetImportForm}>{t('cancel')}</Button>
            <Button disabled={importing} form="quiz-import-form" icon={FileUp} type="submit">
              {importing ? t('importingQuiz') : t('importQuizNow')}
            </Button>
          </>
        )}
      >
        <form className="vstack gap-3" id="quiz-import-form" onSubmit={handleImportSubmit}>
          <p className="text-muted mb-0">{t('importQuizSubtitle')}</p>
          <Input
            label={t('title')}
            value={importForm.title}
            onChange={(event) => setImportForm({ ...importForm, title: event.target.value })}
            required
          />
          <Textarea
            label={t('description')}
            rows="2"
            value={importForm.description}
            onChange={(event) => setImportForm({ ...importForm, description: event.target.value })}
          />
          <div className="row g-2">
            <Input
              className="col-md-6"
              label={t('timeLimit')}
              min="1"
              type="number"
              value={importForm.timeLimitMinutes}
              onChange={(event) => setImportForm({ ...importForm, timeLimitMinutes: event.target.value })}
              required
            />
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" checked={importForm.isActive} onChange={(event) => setImportForm({ ...importForm, isActive: event.target.checked })} />
                <label className="form-check-label fw-semibold">{t('active')}</label>
              </div>
            </div>
          </div>
          <div>
            <label className="form-label">{t('chooseFile')}</label>
            <input
              accept=".xlsx,.pdf,.txt,.md"
              className="form-control"
              type="file"
              onChange={(event) => setImportForm({ ...importForm, file: event.target.files?.[0] || null })}
            />
            <div className="form-text">{t('supportedImportFiles')}</div>
          </div>
          <Textarea
            label={t('rawText')}
            placeholder={t('pasteStandardForm')}
            rows="7"
            value={importForm.rawText}
            onChange={(event) => setImportForm({ ...importForm, rawText: event.target.value })}
          />
          <Card className="p-3 bg-light border-0">
            <div className="fw-bold mb-2">{t('standardImportFormat')}</div>
            <pre className="small mb-0 whitespace-pre-wrap">{t('importFormatSample')}</pre>
          </Card>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel={t('delete')}
        isOpen={Boolean(deleteTarget)}
        message={t('deleteQuizMessage')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('deleteQuizTitle')}
      />
    </>
  )
}

function ImportFormatGuide({ t }) {
  const columns = ['Topic', 'Difficulty', 'Question', 'A', 'B', 'C', 'D', 'Correct', 'Explanation']

  return (
    <Card className="p-4 mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 className="h5 fw-bold mb-1">{t('importFormatGuide')}</h2>
          <p className="text-muted mb-0">{t('importFormatGuideSubtitle')}</p>
        </div>
        <Badge variant="light">.xlsx .pdf .txt .md</Badge>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="fw-bold mb-2">{t('excelFormat')}</div>
          <div className="text-muted small mb-2">{t('excelColumns')}</div>
          <div className="d-flex flex-wrap gap-2">
            {columns.map((column) => (
              <code className="bg-light border rounded-pill px-2 py-1 text-primary" key={column}>{column}</code>
            ))}
          </div>
          <p className="text-muted small mt-3 mb-0">{t('correctAccepted')}</p>
        </div>

        <div className="col-lg-7">
          <div className="fw-bold mb-2">{t('textPdfFormat')}</div>
          <pre className="bg-light border rounded-4 p-3 small mb-2 whitespace-pre-wrap">{t('importFormatSample')}</pre>
          <p className="text-muted small mb-0">{t('importFormatNote')}</p>
        </div>
      </div>
    </Card>
  )
}
