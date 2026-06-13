import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Send } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Badge, { difficultyVariant } from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import AnswerOption from './AnswerOption.jsx'

export default function QuestionCard({
  answer = {},
  canGoNext,
  canGoPrevious,
  index,
  onAnswerChange,
  onNext,
  onPrevious,
  onSubmit,
  question,
  submitting,
  total,
}) {
  const { t } = useI18n()

  function updateAnswer(patch) {
    onAnswerChange(question.id, { ...answer, ...patch })
  }

  function selectSingleOption(optionId) {
    updateAnswer({ selectedOptionId: optionId, selectedOptionIds: [optionId], textAnswer: '' })
  }

  function toggleMultipleOption(optionId) {
    const selectedOptionIds = answer.selectedOptionIds?.includes(optionId)
      ? answer.selectedOptionIds.filter((id) => id !== optionId)
      : [...(answer.selectedOptionIds ?? []), optionId]
    updateAnswer({ selectedOptionIds, selectedOptionId: selectedOptionIds.length === 1 ? selectedOptionIds[0] : null })
  }

  function updateMatching(leftItem, rightItem) {
    updateAnswer({
      matchingAnswer: {
        ...(answer.matchingAnswer ?? {}),
        [leftItem]: rightItem,
      },
    })
  }

  function moveOrderingItem(fromIndex, direction) {
    const orderingAnswer = [...(answer.orderingAnswer ?? question.orderingItems ?? [])]
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= orderingAnswer.length) return

    const [item] = orderingAnswer.splice(fromIndex, 1)
    orderingAnswer.splice(toIndex, 0, item)
    updateAnswer({ orderingAnswer })
  }

  function renderAnswerInput() {
    if (question.questionType === 'MultipleChoice') {
      return renderChoiceOptions({
        answer,
        inputType: 'checkbox',
        onChange: toggleMultipleOption,
        question,
      })
    }

    if (question.questionType === 'SingleChoice' || question.questionType === 'TrueFalse') {
      return renderChoiceOptions({
        answer,
        inputType: 'radio',
        onChange: selectSingleOption,
        question,
      })
    }

    if ((question.questionType === 'CodeOutput' || question.questionType === 'BigOAnalysis') && question.options.length > 0) {
      return renderChoiceOptions({
        answer,
        inputType: 'radio',
        onChange: selectSingleOption,
        question,
      })
    }

    if (question.questionType === 'FillInBlank' || question.questionType === 'CodeOutput' || question.questionType === 'BigOAnalysis') {
      return (
        <div>
          <label className="form-label">{t('yourAnswer')}</label>
          <input
            className="form-control form-control-lg"
            onChange={(event) => updateAnswer({ textAnswer: event.target.value })}
            placeholder={t('typeAnswer')}
            value={answer.textAnswer ?? ''}
          />
        </div>
      )
    }

    if (question.questionType === 'Matching') {
      return (
        <div>
          <label className="form-label">{t('matchingPairs')}</label>
          <div className="vstack gap-2">
            {question.matchingLeftItems.map((leftItem) => (
              <div className="row g-2 align-items-center" key={leftItem}>
                <div className="col-md-5">
                  <div className="rounded-3 border bg-light p-3 fw-semibold">{leftItem}</div>
                </div>
                <div className="col-md-7">
                  <select
                    className="form-select"
                    onChange={(event) => updateMatching(leftItem, event.target.value)}
                    value={answer.matchingAnswer?.[leftItem] ?? ''}
                  >
                    <option value="">{t('chooseMatch')}</option>
                    {question.matchingRightItems.map((rightItem) => (
                      <option key={rightItem} value={rightItem}>{rightItem}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (question.questionType === 'Ordering') {
      const orderingAnswer = answer.orderingAnswer ?? question.orderingItems

      return (
        <div>
          <label className="form-label">{t('orderingItems')}</label>
          <div className="vstack gap-2">
            {orderingAnswer.map((item, itemIndex) => (
              <div className="d-flex gap-2 align-items-center rounded-3 border p-2" key={`${item}-${itemIndex}`}>
                <span className="badge text-bg-light text-dark flex-shrink-0">{itemIndex + 1}</span>
                <span className="flex-grow-1">{item}</span>
                <div className="d-flex gap-1">
                  <Button
                    aria-label={t('moveUp')}
                    disabled={itemIndex === 0}
                    icon={ArrowUp}
                    onClick={() => moveOrderingItem(itemIndex, -1)}
                    size="sm"
                    variant="subtle"
                  />
                  <Button
                    aria-label={t('moveDown')}
                    disabled={itemIndex === orderingAnswer.length - 1}
                    icon={ArrowDown}
                    onClick={() => moveOrderingItem(itemIndex, 1)}
                    size="sm"
                    variant="subtle"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="form-text">{t('orderingHint')}</div>
        </div>
      )
    }

    return null
  }

  return (
    <Card className="p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <div className="d-flex flex-wrap gap-2">
            <Badge variant="light">{t('questionProgress', { current: index + 1, total })}</Badge>
            <Badge variant={difficultyVariant(question.difficulty)}>{t(question.difficulty)}</Badge>
            <Badge variant="secondary">{t(question.questionType)}</Badge>
          </div>
          <h2 className="h4 fw-bold mt-3 mb-0">{question.content}</h2>
        </div>
        <Badge variant="primary">{question.topicName}</Badge>
      </div>

      {question.codeSnippet && (
        <pre className="bg-light border rounded-3 p-3 mb-4 text-start"><code>{question.codeSnippet}</code></pre>
      )}

      {renderAnswerInput()}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top mt-4 pt-4">
        <Button disabled={!canGoPrevious} icon={ArrowLeft} onClick={onPrevious} variant="subtle">
          {t('previous')}
        </Button>
        <div className="d-flex gap-2">
          {canGoNext ? (
            <Button icon={ArrowRight} onClick={onNext}>
              {t('next')}
            </Button>
          ) : (
            <Button disabled={submitting} icon={Send} onClick={onSubmit}>
              {submitting ? t('submitting') : t('submitQuiz')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function renderChoiceOptions({ answer, inputType, onChange, question }) {
  return (
    <div className="vstack gap-3">
      {question.options.map((option) => (
        <AnswerOption
          checked={inputType === 'checkbox'
            ? answer.selectedOptionIds?.includes(option.id) ?? false
            : answer.selectedOptionId === option.id}
          key={option.id}
          name={`question-${question.id}`}
          onChange={() => onChange(option.id)}
          option={option}
          type={inputType}
        />
      ))}
    </div>
  )
}
