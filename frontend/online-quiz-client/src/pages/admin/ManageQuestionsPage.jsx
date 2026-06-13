import { Edit, Eye, Plus, PlusCircle, Save, Search, Trash2, X } from 'lucide-react'
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
const questionTypes = [
  'SingleChoice',
  'MultipleChoice',
  'TrueFalse',
  'FillInBlank',
  'Matching',
  'Ordering',
  'CodeOutput',
  'BigOAnalysis',
]
const flexibleAnswerTypes = new Set(['CodeOutput', 'BigOAnalysis'])
const optionLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function ManageQuestionsPage() {
  const { language, t } = useI18n()
  const [topics, setTopics] = useState([])
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ search: '', topicId: '', difficulty: '', questionType: '' })
  const [form, setForm] = useState(() => createDefaultForm())
  const [editingId, setEditingId] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
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
    if (currentFilters.questionType) params.append('questionType', currentFilters.questionType)
    const { data } = await api.get(`/questions?${params.toString()}`)
    setQuestions(data)
  }, [])

  useEffect(() => {
    async function load() {
      const initialFilters = { search: '', topicId: '', difficulty: '', questionType: '' }
      const [topicResponse] = await Promise.all([api.get('/topics'), loadQuestions(initialFilters)])
      setTopics(topicResponse.data)
    }

    load()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [loadQuestions])

  function openCreate() {
    setEditingId(null)
    setForm(createDefaultForm())
    setModalOpen(true)
  }

  function startEdit(question) {
    setEditingId(question.id)
    setForm(createFormFromQuestion(question))
    setModalOpen(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm(createDefaultForm())
    setModalOpen(false)
  }

  function updateQuestionType(questionType) {
    setForm((current) => {
      const next = createDefaultForm(questionType)
      return {
        ...next,
        content: current.content,
        topicId: current.topicId,
        difficulty: current.difficulty,
        explanation: current.explanation,
        codeSnippet: questionType === 'CodeOutput' ? current.codeSnippet : '',
      }
    })
  }

  function updateAnswerMode(answerMode) {
    setForm((current) => ({
      ...current,
      answerMode,
      options: answerMode === 'choice' && current.options.length === 0 ? createChoiceOptions(4) : current.options,
      correctOptionIndexes: answerMode === 'choice' && current.correctOptionIndexes.length === 0 ? [0] : current.correctOptionIndexes,
      correctTextAnswers: answerMode === 'text' && current.correctTextAnswers.length === 0
        ? [createTextAnswer()]
        : current.correctTextAnswers,
    }))
  }

  function updateOption(index, patch) {
    const options = form.options.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option)
    setForm({ ...form, options })
  }

  function addOption() {
    setForm((current) => ({
      ...current,
      options: relabelOptions([...current.options, { label: labelForIndex(current.options.length), text: '' }]),
    }))
  }

  function removeOption(index) {
    setForm((current) => {
      const options = relabelOptions(current.options.filter((_, optionIndex) => optionIndex !== index))
      const correctOptionIndexes = current.correctOptionIndexes
        .filter((optionIndex) => optionIndex !== index)
        .map((optionIndex) => optionIndex > index ? optionIndex - 1 : optionIndex)

      return {
        ...current,
        options,
        correctOptionIndexes: correctOptionIndexes.length > 0 ? correctOptionIndexes : [0],
      }
    })
  }

  function toggleCorrectOption(index) {
    if (form.questionType === 'MultipleChoice') {
      const selected = form.correctOptionIndexes.includes(index)
        ? form.correctOptionIndexes.filter((optionIndex) => optionIndex !== index)
        : [...form.correctOptionIndexes, index]
      setForm({ ...form, correctOptionIndexes: selected })
      return
    }

    setForm({ ...form, correctOptionIndexes: [index] })
  }

  function updateTextAnswer(index, patch) {
    const correctTextAnswers = form.correctTextAnswers.map((answer, answerIndex) => answerIndex === index ? { ...answer, ...patch } : answer)
    setForm({ ...form, correctTextAnswers })
  }

  function addTextAnswer() {
    setForm({ ...form, correctTextAnswers: [...form.correctTextAnswers, createTextAnswer()] })
  }

  function removeTextAnswer(index) {
    const correctTextAnswers = form.correctTextAnswers.filter((_, answerIndex) => answerIndex !== index)
    setForm({ ...form, correctTextAnswers: correctTextAnswers.length > 0 ? correctTextAnswers : [createTextAnswer()] })
  }

  function updateMatchingPair(index, patch) {
    const matchingPairs = form.matchingPairs.map((pair, pairIndex) => pairIndex === index ? { ...pair, ...patch } : pair)
    setForm({ ...form, matchingPairs })
  }

  function addMatchingPair() {
    setForm({ ...form, matchingPairs: [...form.matchingPairs, createMatchingPair()] })
  }

  function removeMatchingPair(index) {
    const matchingPairs = form.matchingPairs.filter((_, pairIndex) => pairIndex !== index)
    setForm({ ...form, matchingPairs: matchingPairs.length >= 2 ? matchingPairs : [createMatchingPair(), createMatchingPair()] })
  }

  function updateOrderingItem(index, content) {
    const orderingItems = form.orderingItems.map((item, itemIndex) => itemIndex === index ? { ...item, content } : item)
    setForm({ ...form, orderingItems })
  }

  function addOrderingItem() {
    setForm({ ...form, orderingItems: [...form.orderingItems, createOrderingItem()] })
  }

  function removeOrderingItem(index) {
    const orderingItems = form.orderingItems.filter((_, itemIndex) => itemIndex !== index)
    setForm({ ...form, orderingItems: orderingItems.length >= 2 ? orderingItems : [createOrderingItem(), createOrderingItem()] })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = buildPayload(form)
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

  function renderChoiceOptions() {
    const canResize = canResizeOptions(form)
    const minOptions = form.questionType === 'MultipleChoice' || flexibleAnswerTypes.has(form.questionType) ? 2 : form.options.length
    const inputType = form.questionType === 'MultipleChoice' ? 'checkbox' : 'radio'

    return (
      <div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <label className="form-label mb-0">{t('answerOptions')}</label>
          {canResize && (
            <Button icon={Plus} onClick={addOption} size="sm" variant="outline">
              {t('addOption')}
            </Button>
          )}
        </div>
        <div className="vstack gap-2">
          {form.options.map((option, index) => (
            <div className="input-group" key={`${option.label}-${index}`}>
              <span className="input-group-text fw-bold">{labelForIndex(index)}</span>
              <input
                className="form-control"
                value={option.text}
                onChange={(event) => updateOption(index, { text: event.target.value })}
                required
              />
              <span className="input-group-text gap-2">
                <input
                  checked={form.correctOptionIndexes.includes(index)}
                  name="correctOption"
                  onChange={() => toggleCorrectOption(index)}
                  type={inputType}
                />
                <span className="small fw-semibold">{t('correct')}</span>
              </span>
              {canResize && form.options.length > minOptions && (
                <Button icon={X} onClick={() => removeOption(index)} variant="subtle" />
              )}
            </div>
          ))}
        </div>
        <div className="form-text">
          {form.questionType === 'MultipleChoice' ? t('multipleCorrectHint') : t('singleCorrectHint')}
        </div>
      </div>
    )
  }

  function renderTextAnswers() {
    return (
      <div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <label className="form-label mb-0">{t('correctTextAnswers')}</label>
          <Button icon={Plus} onClick={addTextAnswer} size="sm" variant="outline">
            {t('addAnswer')}
          </Button>
        </div>
        <div className="vstack gap-2">
          {form.correctTextAnswers.map((answer, index) => (
            <div className="input-group" key={`text-answer-${index}`}>
              <input
                className="form-control"
                placeholder={t('correctAnswer')}
                value={answer.correctText}
                onChange={(event) => updateTextAnswer(index, { correctText: event.target.value })}
                required
              />
              <span className="input-group-text gap-2">
                <input
                  checked={answer.isCaseSensitive}
                  onChange={(event) => updateTextAnswer(index, { isCaseSensitive: event.target.checked })}
                  type="checkbox"
                />
                <span className="small fw-semibold">{t('caseSensitive')}</span>
              </span>
              {form.correctTextAnswers.length > 1 && (
                <Button icon={X} onClick={() => removeTextAnswer(index)} variant="subtle" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderMatchingPairs() {
    return (
      <div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <label className="form-label mb-0">{t('matchingPairs')}</label>
          <Button icon={Plus} onClick={addMatchingPair} size="sm" variant="outline">
            {t('addPair')}
          </Button>
        </div>
        <div className="vstack gap-2">
          {form.matchingPairs.map((pair, index) => (
            <div className="row g-2 align-items-center" key={`matching-pair-${index}`}>
              <div className="col-md-5">
                <input
                  className="form-control"
                  placeholder={t('leftItem')}
                  value={pair.leftItem}
                  onChange={(event) => updateMatchingPair(index, { leftItem: event.target.value })}
                  required
                />
              </div>
              <div className="col-md-5">
                <input
                  className="form-control"
                  placeholder={t('rightItem')}
                  value={pair.rightItem}
                  onChange={(event) => updateMatchingPair(index, { rightItem: event.target.value })}
                  required
                />
              </div>
              <div className="col-md-2">
                <Button
                  className="w-100"
                  disabled={form.matchingPairs.length <= 2}
                  icon={X}
                  onClick={() => removeMatchingPair(index)}
                  variant="subtle"
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderOrderingItems() {
    return (
      <div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <label className="form-label mb-0">{t('orderingItems')}</label>
          <Button icon={Plus} onClick={addOrderingItem} size="sm" variant="outline">
            {t('addItem')}
          </Button>
        </div>
        <div className="vstack gap-2">
          {form.orderingItems.map((item, index) => (
            <div className="input-group" key={`ordering-item-${index}`}>
              <span className="input-group-text fw-bold">{index + 1}</span>
              <input
                className="form-control"
                placeholder={t('orderingItem')}
                value={item.content}
                onChange={(event) => updateOrderingItem(index, event.target.value)}
                required
              />
              <Button
                disabled={form.orderingItems.length <= 2}
                icon={X}
                onClick={() => removeOrderingItem(index)}
                variant="subtle"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) return <LoadingState />

  const usesChoice = usesChoiceAnswers(form)
  const usesText = usesTextAnswers(form)
  const needsCodeSnippet = form.questionType === 'CodeOutput'

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
          <div className="col-xl-4 col-lg-6">
            <label className="form-label">{t('searchContent')}</label>
            <div className="input-group">
              <span className="input-group-text"><Search size={16} /></span>
              <input className="form-control" placeholder={t('searchContent')} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            </div>
          </div>
          <Select className="col-xl-2 col-lg-3 col-md-6" label={t('topic')} value={filters.topicId} onChange={(event) => setFilters({ ...filters, topicId: event.target.value })}>
            <option value="">{t('allTopics')}</option>
            {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
          </Select>
          <Select className="col-xl-2 col-lg-3 col-md-6" label={t('difficulty')} value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}>
            <option value="">{t('all')}</option>
            {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{t(difficulty)}</option>)}
          </Select>
          <Select className="col-xl-2 col-lg-3 col-md-6" label={t('questionType')} value={filters.questionType} onChange={(event) => setFilters({ ...filters, questionType: event.target.value })}>
            <option value="">{t('allTypes')}</option>
            {questionTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}
          </Select>
          <div className="col-xl-2 col-lg-3 col-md-6">
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
                <th>{t('questionType')}</th>
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
                  <td><Badge variant="light">{t(question.questionType)}</Badge></td>
                  <td>{question.topicName}</td>
                  <td><Badge variant={difficultyVariant(question.difficulty)}>{t(question.difficulty)}</Badge></td>
                  <td>{formatDate(question.createdAt, language)}</td>
                  <td className="text-end">
                    <Button className="me-2" icon={Eye} onClick={() => setViewTarget(question)} size="sm" variant="subtle">{t('view')}</Button>
                    <Button className="me-2" icon={Edit} onClick={() => startEdit(question)} size="sm" variant="outline">{t('edit')}</Button>
                    <Button icon={Trash2} onClick={() => setDeleteTarget(question)} size="sm" variant="dangerOutline">{t('delete')}</Button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan="6">
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
            <Select className="col-md-6" label={t('topic')} value={form.topicId} onChange={(event) => setForm({ ...form, topicId: event.target.value })} required>
              <option value="">{t('selectTopic')}</option>
              {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </Select>
            <Select className="col-md-3" label={t('difficulty')} value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{t(difficulty)}</option>)}
            </Select>
            <Select className="col-md-3" label={t('questionType')} value={form.questionType} onChange={(event) => updateQuestionType(event.target.value)}>
              {questionTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}
            </Select>
          </div>

          {needsCodeSnippet && (
            <Textarea
              label={t('codeSnippet')}
              rows="5"
              value={form.codeSnippet}
              onChange={(event) => setForm({ ...form, codeSnippet: event.target.value })}
              required
            />
          )}

          {flexibleAnswerTypes.has(form.questionType) && (
            <Select label={t('answerMode')} value={form.answerMode} onChange={(event) => updateAnswerMode(event.target.value)}>
              <option value="text">{t('textAnswer')}</option>
              <option value="choice">{t('choiceAnswer')}</option>
            </Select>
          )}

          {usesChoice && renderChoiceOptions()}
          {usesText && renderTextAnswers()}
          {form.questionType === 'Matching' && renderMatchingPairs()}
          {form.questionType === 'Ordering' && renderOrderingItems()}

          <Textarea
            label={t('explanation')}
            rows="3"
            value={form.explanation}
            onChange={(event) => setForm({ ...form, explanation: event.target.value })}
            required
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title={t('questionDetails')}
        footer={<Button variant="subtle" onClick={() => setViewTarget(null)}>{t('cancel')}</Button>}
      >
        {viewTarget && (
          <div className="vstack gap-3">
            <div>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge variant="light">{t(viewTarget.questionType)}</Badge>
                <Badge variant={difficultyVariant(viewTarget.difficulty)}>{t(viewTarget.difficulty)}</Badge>
                <Badge variant="secondary">{viewTarget.topicName}</Badge>
              </div>
              <h5 className="mb-0">{viewTarget.content}</h5>
            </div>

            {viewTarget.codeSnippet && (
              <div>
                <label className="form-label">{t('codeSnippet')}</label>
                <pre className="bg-light border rounded-3 p-3 mb-0"><code>{viewTarget.codeSnippet}</code></pre>
              </div>
            )}

            {renderQuestionAnswers(viewTarget, t)}

            <div>
              <label className="form-label">{t('explanation')}</label>
              <p className="mb-0 text-muted">{viewTarget.explanation}</p>
            </div>
          </div>
        )}
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

function createDefaultForm(questionType = 'SingleChoice') {
  const form = {
    content: '',
    topicId: '',
    difficulty: 'Easy',
    questionType,
    explanation: '',
    codeSnippet: '',
    answerMode: questionType === 'BigOAnalysis' ? 'choice' : 'text',
    options: [],
    correctOptionIndexes: [0],
    correctTextAnswers: [],
    matchingPairs: [],
    orderingItems: [],
  }

  if (questionType === 'SingleChoice') {
    return { ...form, answerMode: 'choice', options: createChoiceOptions(4) }
  }

  if (questionType === 'MultipleChoice') {
    return { ...form, answerMode: 'choice', options: createChoiceOptions(4) }
  }

  if (questionType === 'TrueFalse') {
    return { ...form, answerMode: 'choice', options: createTrueFalseOptions() }
  }

  if (questionType === 'Matching') {
    return { ...form, matchingPairs: [createMatchingPair(), createMatchingPair(), createMatchingPair()] }
  }

  if (questionType === 'Ordering') {
    return { ...form, orderingItems: [createOrderingItem(), createOrderingItem(), createOrderingItem()] }
  }

  if (questionType === 'CodeOutput') {
    return { ...form, correctTextAnswers: [createTextAnswer()] }
  }

  if (questionType === 'BigOAnalysis') {
    return { ...form, answerMode: 'choice', options: createChoiceOptions(4), correctTextAnswers: [createTextAnswer()] }
  }

  return { ...form, correctTextAnswers: [createTextAnswer()] }
}

function createFormFromQuestion(question) {
  const questionType = question.questionType || 'SingleChoice'
  const options = (question.options || []).map((option, index) => ({
    label: option.label || labelForIndex(index),
    text: option.text || '',
    isCorrect: Boolean(option.isCorrect) || option.id === question.correctOptionId,
    optionOrder: option.optionOrder ?? index,
  }))
  const correctOptionIndexes = options
    .map((option, index) => option.isCorrect ? index : null)
    .filter((index) => index !== null)
  const hasChoiceAnswers = options.length > 0
  const hasTextAnswers = question.correctTextAnswers?.length > 0
  const answerMode = flexibleAnswerTypes.has(questionType)
    ? hasChoiceAnswers ? 'choice' : 'text'
    : questionType === 'FillInBlank' ? 'text' : 'choice'

  return {
    ...createDefaultForm(questionType),
    content: question.content || '',
    topicId: String(question.topicId || ''),
    difficulty: question.difficulty || 'Easy',
    questionType,
    explanation: question.explanation || '',
    codeSnippet: question.codeSnippet || '',
    answerMode,
    options: hasChoiceAnswers ? options : createDefaultForm(questionType).options,
    correctOptionIndexes: correctOptionIndexes.length > 0 ? correctOptionIndexes : [0],
    correctTextAnswers: hasTextAnswers
      ? question.correctTextAnswers.map((answer) => ({
        correctText: answer.correctText || '',
        isCaseSensitive: Boolean(answer.isCaseSensitive),
      }))
      : [createTextAnswer()],
    matchingPairs: question.matchingPairs?.length > 0
      ? question.matchingPairs.map((pair) => ({
        leftItem: pair.leftItem || '',
        rightItem: pair.rightItem || '',
      }))
      : createDefaultForm(questionType).matchingPairs,
    orderingItems: question.orderingItems?.length > 0
      ? question.orderingItems.map((item) => ({ content: item.content || '' }))
      : createDefaultForm(questionType).orderingItems,
  }
}

function buildPayload(form) {
  const payload = {
    content: form.content,
    topicId: Number(form.topicId),
    difficulty: form.difficulty,
    questionType: form.questionType,
    explanation: form.explanation,
    codeSnippet: form.questionType === 'CodeOutput' ? form.codeSnippet : null,
    options: [],
    correctOptionIndex: form.correctOptionIndexes[0] ?? 0,
    correctOptionIndexes: [],
    correctTextAnswers: [],
    matchingPairs: [],
    orderingItems: [],
  }

  if (usesChoiceAnswers(form)) {
    payload.options = form.options.map((option, index) => ({
      label: labelForIndex(index),
      text: option.text,
      isCorrect: form.correctOptionIndexes.includes(index),
      optionOrder: index,
    }))
    payload.correctOptionIndexes = form.correctOptionIndexes
  }

  if (usesTextAnswers(form)) {
    payload.correctTextAnswers = form.correctTextAnswers
      .map((answer) => ({
        correctText: answer.correctText,
        isCaseSensitive: Boolean(answer.isCaseSensitive),
      }))
      .filter((answer) => answer.correctText.trim().length > 0)
  }

  if (form.questionType === 'Matching') {
    payload.matchingPairs = form.matchingPairs.map((pair, index) => ({
      leftItem: pair.leftItem,
      rightItem: pair.rightItem,
      pairOrder: index,
    }))
  }

  if (form.questionType === 'Ordering') {
    payload.orderingItems = form.orderingItems.map((item, index) => ({
      content: item.content,
      correctOrder: index,
    }))
  }

  return payload
}

function usesChoiceAnswers(form) {
  return ['SingleChoice', 'MultipleChoice', 'TrueFalse'].includes(form.questionType) ||
    (flexibleAnswerTypes.has(form.questionType) && form.answerMode === 'choice')
}

function usesTextAnswers(form) {
  return form.questionType === 'FillInBlank' ||
    (flexibleAnswerTypes.has(form.questionType) && form.answerMode === 'text')
}

function canResizeOptions(form) {
  return form.questionType === 'MultipleChoice' ||
    (flexibleAnswerTypes.has(form.questionType) && form.answerMode === 'choice')
}

function createChoiceOptions(count) {
  return Array.from({ length: count }, (_, index) => ({ label: labelForIndex(index), text: '' }))
}

function createTrueFalseOptions() {
  return [
    { label: 'A', text: 'True' },
    { label: 'B', text: 'False' },
  ]
}

function createTextAnswer() {
  return { correctText: '', isCaseSensitive: false }
}

function createMatchingPair() {
  return { leftItem: '', rightItem: '' }
}

function createOrderingItem() {
  return { content: '' }
}

function relabelOptions(options) {
  return options.map((option, index) => ({ ...option, label: labelForIndex(index) }))
}

function labelForIndex(index) {
  return optionLabels[index] || String(index + 1)
}

function renderQuestionAnswers(question, t) {
  const hasOptions = question.options?.length > 0
  const hasTextAnswers = question.correctTextAnswers?.length > 0
  const hasMatchingPairs = question.matchingPairs?.length > 0
  const hasOrderingItems = question.orderingItems?.length > 0

  return (
    <>
      {hasOptions && (
        <div>
          <label className="form-label">{t('answerOptions')}</label>
          <div className="vstack gap-2">
            {question.options.map((option) => (
              <div className="d-flex align-items-center justify-content-between gap-3 rounded-3 border p-2" key={option.id}>
                <span><strong>{option.label}.</strong> {option.text}</span>
                {option.isCorrect && <Badge variant="success">{t('correct')}</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasTextAnswers && (
        <div>
          <label className="form-label">{t('correctTextAnswers')}</label>
          <div className="d-flex flex-wrap gap-2">
            {question.correctTextAnswers.map((answer) => (
              <Badge key={answer.id} variant="success">{answer.correctText}</Badge>
            ))}
          </div>
        </div>
      )}

      {hasMatchingPairs && (
        <div>
          <label className="form-label">{t('matchingPairs')}</label>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <tbody>
                {question.matchingPairs.map((pair) => (
                  <tr key={pair.id}>
                    <td className="fw-semibold">{pair.leftItem}</td>
                    <td>{pair.rightItem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasOrderingItems && (
        <div>
          <label className="form-label">{t('orderingItems')}</label>
          <ol className="mb-0">
            {question.orderingItems.map((item) => <li key={item.id}>{item.content}</li>)}
          </ol>
        </div>
      )}
    </>
  )
}
