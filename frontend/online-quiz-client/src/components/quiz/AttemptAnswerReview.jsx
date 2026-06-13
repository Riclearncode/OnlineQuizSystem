import { CheckCircle2, XCircle } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Badge, { difficultyVariant } from '../ui/Badge.jsx'
import Card from '../ui/Card.jsx'

export default function AttemptAnswerReview({ answer, compact = false, number }) {
  const { t } = useI18n()
  const content = (
    <div className="d-flex gap-3 align-items-start">
      <div className={`icon-box ${answer.isCorrect ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} flex-shrink-0`}>
        {answer.isCorrect ? <CheckCircle2 size={compact ? 18 : 22} /> : <XCircle size={compact ? 18 : 22} />}
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
          <div>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {number && <Badge variant="light">{t('questionNumber', { number })}</Badge>}
              <Badge variant="secondary">{t(answer.questionType)}</Badge>
              <Badge variant={difficultyVariant(answer.difficulty)}>{t(answer.difficulty)}</Badge>
            </div>
            <h2 className={compact ? 'h6 fw-bold mb-0' : 'h5 fw-bold mb-0'}>
              {answer.questionContent}
            </h2>
          </div>
          <Badge variant={answer.isCorrect ? 'success' : 'danger'}>
            {answer.isCorrect ? t('correct') : t('wrong')}
          </Badge>
        </div>

        {answer.codeSnippet && (
          <pre className="bg-light border rounded-3 p-3 my-3 text-start"><code>{answer.codeSnippet}</code></pre>
        )}

        <div className="row g-3 mt-1">
          <div className="col-lg-6">
            <AnswerBlock title={t('yourAnswer')}>
              <SubmittedAnswer answer={answer} />
            </AnswerBlock>
          </div>
          <div className="col-lg-6">
            <AnswerBlock title={t('correctAnswer')}>
              <CorrectAnswer answer={answer} />
            </AnswerBlock>
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-between gap-2 mt-3">
          <p className="text-muted mb-0">{answer.explanation}</p>
          <span className="small fw-semibold text-muted">
            {t('score')}: {formatPoint(answer.score)}/{formatPoint(answer.maxScore)}
          </span>
        </div>
      </div>
    </div>
  )

  return compact
    ? <div className="border rounded-4 p-3">{content}</div>
    : <Card className="p-4">{content}</Card>
}

function AnswerBlock({ children, title }) {
  return (
    <div className="border rounded-4 p-3 h-100 bg-light bg-opacity-50">
      <div className="form-label mb-2">{title}</div>
      {children}
    </div>
  )
}

function SubmittedAnswer({ answer }) {
  const { t } = useI18n()
  const matchingAnswer = parseObject(answer.matchingAnswerJson)
  const orderingAnswer = parseArray(answer.orderingAnswerJson)
  const selectedOptions = answer.selectedOptions ?? []

  if (selectedOptions.length > 0) {
    return <OptionList options={selectedOptions} />
  }

  if (answer.selectedOptionText) {
    return <p className="mb-0">{answer.selectedOptionText}</p>
  }

  if (answer.textAnswer) {
    return <p className="mb-0">{answer.textAnswer}</p>
  }

  if (Object.keys(matchingAnswer).length > 0) {
    return <KeyValueTable rows={Object.entries(matchingAnswer)} />
  }

  if (orderingAnswer.length > 0) {
    return <OrderedAnswerList items={orderingAnswer} />
  }

  return <p className="text-muted mb-0">{t('notAnswered')}</p>
}

function CorrectAnswer({ answer }) {
  const { t } = useI18n()

  if (answer.correctOptions?.length > 0) {
    return <OptionList options={answer.correctOptions} />
  }

  if (answer.correctTextAnswers?.length > 0) {
    return (
      <div className="d-flex flex-wrap gap-2">
        {answer.correctTextAnswers.map((item) => <Badge key={item} variant="success">{item}</Badge>)}
      </div>
    )
  }

  if (answer.correctMatchingPairs?.length > 0) {
    return <KeyValueTable rows={answer.correctMatchingPairs.map((pair) => [pair.leftItem, pair.rightItem])} />
  }

  if (answer.correctOrderingItems?.length > 0) {
    return <OrderedAnswerList items={answer.correctOrderingItems.map((item) => item.content)} />
  }

  return <p className="text-muted mb-0">{answer.correctOptionText || t('notAnswered')}</p>
}

function OptionList({ options }) {
  return (
    <div className="vstack gap-2">
      {options.map((option) => (
        <div className="d-flex gap-2 align-items-start" key={option.id}>
          <Badge variant="light">{option.label}</Badge>
          <span>{option.text}</span>
        </div>
      ))}
    </div>
  )
}

function KeyValueTable({ rows }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm mb-0">
        <tbody>
          {rows.map(([left, right]) => (
            <tr key={`${left}-${right}`}>
              <td className="fw-semibold">{left}</td>
              <td>{right}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrderedAnswerList({ items }) {
  return (
    <ol className="mb-0 ps-3">
      {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
    </ol>
  )
}

function parseObject(value) {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function parseArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatPoint(value) {
  return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
}
