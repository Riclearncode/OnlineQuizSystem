import { Edit, PlusCircle, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

const emptyForm = { name: '', description: '' }

export default function ManageTopicsPage() {
  const { t } = useI18n()
  const [topics, setTopics] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadTopics() {
    const { data } = await api.get('/topics')
    setTopics(data)
  }

  useEffect(() => {
    loadTopics()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      if (editingId) {
        await api.put(`/topics/${editingId}`, form)
      } else {
        await api.post('/topics', form)
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadTopics()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await api.delete(`/topics/${id}`)
      await loadTopics()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('manageTopics')} subtitle={t('manageTopicsSubtitle')} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        <div className="col-lg-4">
          <form className="page-card p-3 vstack gap-3" onSubmit={handleSubmit}>
            <h2 className="h5 mb-0">{editingId ? t('editTopic') : t('newTopic')}</h2>
            <div>
              <label className="form-label">{t('name')}</label>
              <input className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div>
              <label className="form-label">{t('description')}</label>
              <textarea className="form-control" rows="4" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary d-inline-flex align-items-center gap-2">
                {editingId ? <Save size={16} /> : <PlusCircle size={16} />}
                {editingId ? t('save') : t('create')}
              </button>
              {editingId && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditingId(null); setForm(emptyForm) }}>{t('cancel')}</button>}
            </div>
          </form>
        </div>

        <div className="col-lg-8">
          <div className="page-card p-3">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>{t('name')}</th><th>{t('description')}</th><th></th></tr></thead>
                <tbody>
                  {topics.map((topic) => (
                    <tr key={topic.id}>
                      <td className="fw-semibold">{topic.name}</td>
                      <td>{topic.description}</td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-sm me-2" title={t('edit')} onClick={() => { setEditingId(topic.id); setForm({ name: topic.name, description: topic.description || '' }) }}><Edit size={15} /></button>
                        <button className="btn btn-outline-danger btn-sm" title={t('delete')} onClick={() => handleDelete(topic.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
