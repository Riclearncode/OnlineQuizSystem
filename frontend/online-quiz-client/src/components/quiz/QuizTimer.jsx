import { Timer } from 'lucide-react'

export default function QuizTimer({ secondsLeft }) {
  const minutes = Math.floor((secondsLeft ?? 0) / 60)
  const seconds = String((secondsLeft ?? 0) % 60).padStart(2, '0')
  const isLow = (secondsLeft ?? 0) <= 60

  return (
    <div className={`badge ${isLow ? 'text-bg-danger' : 'text-bg-dark'} fs-6 d-inline-flex align-items-center gap-2`}>
      <Timer size={17} />
      {minutes}:{seconds}
    </div>
  )
}
