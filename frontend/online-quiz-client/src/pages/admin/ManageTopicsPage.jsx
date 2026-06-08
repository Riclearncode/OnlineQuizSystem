import { Edit, PlusCircle, Save, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Input, { Textarea } from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

const emptyForm = { name: '', description: '' }

export default function ManageTopicsPage() {
  const { language, t } = useI18n()
  const [topics, setTopics] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const filteredTopics = useMemo(() => {
    const value = search.trim().toLowerCase()
    if (!value) return topics
    return topics.filter((topic) =>
      topic.name.toLowerCase().includes(value) ||
      (topic.description || '').toLowerCase().includes(value))
  }, [search, topics])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(topic) {
    setEditingId(topic.id)
    setForm({ name: topic.name, description: topic.description || '' })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/topics/${editingId}`, form)
      } else {
        await api.post('/topics', form)
      }
      setModalOpen(false)
      setForm(emptyForm)
      setEditingId(null)
      await loadTopics()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setError('')
    try {
      await api.delete(`/topics/${deleteTarget.id}`)
      setDeleteTarget(null)
      await loadTopics()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader
        title={t('manageTopics')}
        subtitle={t('manageTopicsSubtitle')}
        action={<Button icon={PlusCircle} onClick={openCreate}>{t('addTopic')}</Button>}
      />
      <Alert>{error}</Alert>

      <Card className="p-4 mb-3">
        <div className="input-group">
          <span className="input-group-text"><Search size={16} /></span>
          <input className="form-control" placeholder={t('searchTopics')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('description')}</th>
                <th>{t('createdAt')}</th>
                <th className="text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTopics.map((topic) => (
                <tr key={topic.id}>
                  <td className="fw-semibold">{topic.name}</td>
                  <td className="text-muted">{topic.description || '-'}</td>
                  <td>{formatDate(topic.createdAt, language)}</td>
                  <td className="text-end">
                    <Button className="me-2" icon={Edit} onClick={() => openEdit(topic)} size="sm" variant="outline">{t('edit')}</Button>
                    <Button icon={Trash2} onClick={() => setDeleteTarget(topic)} size="sm" variant="dangerOutline">{t('delete')}</Button>
                  </td>
                </tr>
              ))}
              {filteredTopics.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <EmptyState compact message={t('noTopicsFound')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('editTopic') : t('newTopic')}
        footer={(
          <>
            <Button variant="subtle" onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
            <Button disabled={saving} form="topic-form" icon={editingId ? Save : PlusCircle} type="submit">
              {saving ? t('creating') : editingId ? t('save') : t('create')}
            </Button>
          </>
        )}
      >
        <form className="vstack gap-3" id="topic-form" onSubmit={handleSubmit}>
          <Input
            label={t('name')}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <Textarea
            label={t('description')}
            rows="4"
            value={form.description || ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel={t('delete')}
        isOpen={Boolean(deleteTarget)}
        message={t('deleteTopicMessage')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t('deleteTopicTitle')}
      />
    </>
  )
}
