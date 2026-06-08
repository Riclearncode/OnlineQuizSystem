import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import QuestionCard from '../../components/quiz/QuestionCard.jsx'
import QuizProgress from '../../components/quiz/QuizProgress.jsx'
import QuizTimer from '../../components/quiz/QuizTimer.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Card from '../../components/ui/Card.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function TakeQuizPage() {
  const { t } = useI18n()
  const { quizId } = useParams()
  const navigate = useNavigate()
  const startedRef = useRef(false)
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    api.post('/quiz-attempts/start', { quizId: Number(quizId) })
      .then((response) => {
        setQuiz(response.data)
        setSecondsLeft(response.data.timeLimitMinutes * 60)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [quizId])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || submitting) return undefined
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft, submitting])

  function selectAnswer(questionId, optionId) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }))
  }

  async function submitQuiz() {
    if (!quiz || submitting) return

    setSubmitting(true)
    setConfirmOpen(false)
    setError('')
    try {
      const payload = {
        attemptId: quiz.attemptId,
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: answers[question.id] ?? null,
        })),
      }
      const { data } = await api.post('/quiz-attempts/submit', payload)
      navigate(`/student/results/${data.id}`, { state: { result: data } })
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState text={t('startingQuiz')} />

  if (!quiz) {
    return <Alert>{error || t('quizCouldNotStart')}</Alert>
  }

  const question = quiz.questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < quiz.questions.length - 1

  return (
    <>
      <PageHeader
        title={quiz.title}
        subtitle={`${t('questionCount', { count: quiz.questions.length })} | ${t('minuteCount', { count: quiz.timeLimitMinutes })}`}
        action={<QuizTimer secondsLeft={secondsLeft} />}
      />
      <Alert>{error}</Alert>

      <div className="row g-4">
        <div className="col-xl-9">
          <QuestionCard
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            index={currentIndex}
            onNext={() => setCurrentIndex((value) => Math.min(value + 1, quiz.questions.length - 1))}
            onPrevious={() => setCurrentIndex((value) => Math.max(value - 1, 0))}
            onSelect={selectAnswer}
            onSubmit={() => setConfirmOpen(true)}
            question={question}
            selectedOptionId={answers[question.id]}
            submitting={submitting}
            total={quiz.questions.length}
          />
        </div>
        <div className="col-xl-3">
          <Card className="p-4 sticky-top quiz-sticky-panel">
            <QuizProgress answered={answeredCount} current={currentIndex} total={quiz.questions.length} />
            <div className="row g-2 mt-3">
              {quiz.questions.map((item, index) => (
                <div className="col-3" key={item.id}>
                  <button
                    className={`btn btn-sm w-100 ${index === currentIndex ? 'btn-primary' : answers[item.id] ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                    onClick={() => setCurrentIndex(index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        confirmLabel={t('submitQuiz')}
        isOpen={confirmOpen}
        message={t('submitConfirmMessage')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submitQuiz}
        title={t('submitConfirmTitle')}
        variant="primary"
      />
    </>
  )
}
