import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import QuizCard from '../../components/quiz/QuizCard.jsx'
import Alert from '../../components/ui/Alert.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function ActiveQuizzesPage() {
  const { t } = useI18n()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/quizzes')
      .then((response) => setQuizzes(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('activeQuizzes')} subtitle={t('activeQuizzesSubtitle')} />
      <Alert>{error}</Alert>

      {quizzes.length > 0 ? (
        <div className="row g-3">
          {quizzes.map((quiz) => (
            <div className="col-xl-4 col-md-6" key={quiz.id}>
              <QuizCard quiz={quiz} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={t('noActiveQuizzes')} />
      )}
    </>
  )
}
