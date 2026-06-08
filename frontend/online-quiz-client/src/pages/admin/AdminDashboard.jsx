import { ClipboardList, HelpCircle, ListChecks, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
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
      {error && <div className="alert alert-danger">{error}</div>}

      {summary && (
        <>
          <div className="row g-3 mb-4">
            <Stat icon={Users} label={t('users')} value={summary.totalUsers} />
            <Stat icon={HelpCircle} label={t('questions')} value={summary.totalQuestions} />
            <Stat icon={ClipboardList} label={t('quizzes')} value={summary.totalQuizzes} />
            <Stat icon={ListChecks} label={t('attempts')} value={summary.totalAttempts} />
          </div>

          <div className="row g-3">
            <DashboardTable title={t('topStudents')} columns={[t('student'), t('email'), t('bestScoreColumn')]} rows={summary.topStudents.map((x) => [x.studentName, x.email, `${x.bestScore}%`])} emptyText={t('noData')} />
            <DashboardTable title={t('questionsByTopic')} columns={[t('topic'), t('questions')]} rows={summary.questionsByTopic.map((x) => [x.topicName, x.questionCount])} emptyText={t('noData')} />
            <DashboardTable title={t('attemptsByQuiz')} columns={[t('quiz'), t('attempts')]} rows={summary.attemptsByQuiz.map((x) => [x.quizTitle, x.attemptCount])} emptyText={t('noData')} />
          </div>
        </>
      )}
    </>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="col-xl-3 col-sm-6">
      <div className="stat-card p-3 d-flex align-items-center gap-3">
        <div className="bg-primary-subtle text-primary rounded-2 p-2"><Icon size={24} /></div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fs-3 fw-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}

function DashboardTable({ title, columns, rows, emptyText }) {
  return (
    <div className="col-xl-4">
      <div className="page-card p-3 h-100">
        <h2 className="h5 mb-3">{title}</h2>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={columns.length} className="text-muted">{emptyText}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
