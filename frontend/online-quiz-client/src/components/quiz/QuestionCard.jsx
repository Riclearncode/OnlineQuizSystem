import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import AnswerOption from './AnswerOption.jsx'

export default function QuestionCard({
  canGoNext,
  canGoPrevious,
  index,
  onNext,
  onPrevious,
  onSelect,
  onSubmit,
  question,
  selectedOptionId,
  submitting,
  total,
}) {
  const { t } = useI18n()

  return (
    <Card className="p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <Badge variant="light">{t('questionProgress', { current: index + 1, total })}</Badge>
          <h2 className="h4 fw-bold mt-3 mb-0">{question.content}</h2>
        </div>
        <Badge variant="primary">{question.topicName}</Badge>
      </div>

      <div className="vstack gap-3">
        {question.options.map((option) => (
          <AnswerOption
            checked={selectedOptionId === option.id}
            key={option.id}
            name={`question-${question.id}`}
            onChange={() => onSelect(question.id, option.id)}
            option={option}
          />
        ))}
      </div>

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
