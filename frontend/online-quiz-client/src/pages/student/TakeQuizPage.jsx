import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function TakeQuizPage() {
  const { t } = useI18n()
  const { quizId } = useParams()
  const navigate = useNavigate()
  const startedRef = useRef(false)
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
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

  async function handleSubmit(event) {
    event.preventDefault()
    if (!quiz) return

    setSubmitting(true)
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
    return <div className="alert alert-danger">{error || t('quizCouldNotStart')}</div>
  }

  const minutes = Math.floor((secondsLeft ?? 0) / 60)
  const seconds = String((secondsLeft ?? 0) % 60).padStart(2, '0')

  return (
    <>
      <PageHeader
        title={quiz.title}
        subtitle={`${t('questionCount', { count: quiz.questions.length })} · ${t('minuteCount', { count: quiz.timeLimitMinutes })}`}
        action={<span className="badge text-bg-dark fs-6">{minutes}:{seconds}</span>}
      />
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="vstack gap-3">
        {quiz.questions.map((question, index) => (
          <div className="page-card p-3" key={question.id}>
            <div className="d-flex justify-content-between gap-3 mb-3">
              <h2 className="h6 mb-0">{t('questionNumber', { number: index + 1 })} {question.content}</h2>
              <span className="badge text-bg-light">{question.topicName}</span>
            </div>
            <div className="vstack gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id
                return (
                  <label className={`quiz-option p-3 ${selected ? 'selected' : ''}`} key={option.id}>
                    <input
                      className="form-check-input me-2"
                      type="radio"
                      name={`question-${question.id}`}
                      checked={selected}
                      onChange={() => setAnswers({ ...answers, [question.id]: option.id })}
                    />
                    <strong>{option.label}.</strong> {option.text}
                  </label>
                )
              })}
            </div>
          </div>
        ))}

        <div className="page-card p-3 d-flex justify-content-between align-items-center">
          <span className="text-muted">{t('answeredCount', { answered: Object.keys(answers).length, total: quiz.questions.length })}</span>
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={submitting}>
            <Send size={18} />
            {submitting ? t('submitting') : t('submitQuiz')}
          </button>
        </div>
      </form>
    </>
  )
}
