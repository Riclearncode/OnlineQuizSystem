import { ClipboardList, HelpCircle, ListChecks, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function AdminDashboard() {
  const { t } = useI18n()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/dashboard-summary')
      .then((response) => setSummary(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('adminDashboard')} subtitle={t('adminDashboardSubtitle')} />
      <Alert>{error}</Alert>

      {summary ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-xl-3 col-sm-6">
              <StatCard icon={Users} label={t('users')} tone="primary" value={summary.totalUsers} />
            </div>
            <div className="col-xl-3 col-sm-6">
              <StatCard icon={HelpCircle} label={t('questions')} tone="success" value={summary.totalQuestions} />
            </div>
            <div className="col-xl-3 col-sm-6">
              <StatCard icon={ClipboardList} label={t('quizzes')} tone="warning" value={summary.totalQuizzes} />
            </div>
            <div className="col-xl-3 col-sm-6">
              <StatCard icon={ListChecks} label={t('attempts')} tone="danger" value={summary.totalAttempts} />
            </div>
          </div>

          <div className="row g-3">
            <DashboardTable title={t('topStudents')} columns={[t('student'), t('email'), t('bestScoreColumn')]} rows={summary.topStudents.map((x) => [x.studentName, x.email, `${x.bestScore}%`])} emptyText={t('noData')} />
            <DashboardTable title={t('questionsByTopic')} columns={[t('topic'), t('questions')]} rows={summary.questionsByTopic.map((x) => [x.topicName, x.questionCount])} emptyText={t('noData')} />
            <DashboardTable title={t('attemptsByQuiz')} columns={[t('quiz'), t('attempts')]} rows={summary.attemptsByQuiz.map((x) => [x.quizTitle, x.attemptCount])} emptyText={t('noData')} />
          </div>
        </>
      ) : (
        <EmptyState message={t('noData')} />
      )}
    </>
  )
}

function DashboardTable({ title, columns, rows, emptyText }) {
  return (
    <div className="col-xl-4">
      <Card className="p-0 h-100 overflow-hidden">
        <div className="border-bottom px-4 py-3">
          <h2 className="h5 fw-bold mb-0">{title}</h2>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead>
              <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState compact message={emptyText} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
