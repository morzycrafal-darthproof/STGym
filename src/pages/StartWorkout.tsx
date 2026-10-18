import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { formatDate } from '../lib/util'
import { nextDay, useStore } from '../store'

export function StartWorkout() {
  const plans = useStore((s) => s.plans)
  const sessions = useStore((s) => s.sessions)
  const startSession = useStore((s) => s.startSession)
  const navigate = useNavigate()
  const [openPlan, setOpenPlan] = useState<string | null>(null)

  const inProgress = sessions.filter((s) => !s.finishedAt).sort((a, b) => b.date.localeCompare(a.date))
  const start = (from?: { planId: string; weekId: string; dayId: string }) => navigate(`/trening/${startSession(from)}`)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Trening</h1>
          <p className="muted">Wybierz dzień z planu albo zacznij pusty trening.</p>
        </div>
        <button className="btn" onClick={() => start()}>
          <Icon name="plus" size={16} /> Pusty trening
        </button>
      </div>

      {inProgress.length > 0 && (
        <div className="card list">
          {inProgress.map((s) => (
            <Link to={`/trening/${s.id}`} className="list-item" key={s.id}>
              <span className="pill ss">W trakcie</span>
              <span className="grow">{s.title}</span>
              <span className="muted small">{formatDate(s.date)}</span>
            </Link>
          ))}
        </div>
      )}

      {plans.map((plan) => {
        const next = nextDay(plan, sessions)
        const doneIds = new Set(sessions.filter((s) => s.planId === plan.id).map((s) => s.dayId))
        const open = openPlan === plan.id
        return (
          <div className="card stack" key={plan.id}>
            <div className="row between">
              <h2>{plan.name}</h2>
              <button className="btn sm ghost" onClick={() => setOpenPlan(open ? null : plan.id)}>
                {open ? 'Zwiń' : 'Wszystkie dni'}
              </button>
            </div>
            {next ? (
              <button className="btn primary block" onClick={() => start({ planId: plan.id, weekId: next.week.id, dayId: next.day.id })}>
                <Icon name="play" size={16} />
                <span className="grow">
                  Następny: {next.week.name.split(':')[0]} · {next.day.name}
                </span>
              </button>
            ) : (
              <p className="muted small">Wszystkie dni z tego planu są już wykonane. Dodaj kolejny tydzień w edytorze.</p>
            )}
            {open &&
              plan.weeks.map((w) => (
                <div key={w.id} className="stack" style={{ gap: 6 }}>
                  <span className="muted small">{w.name}</span>
                  {w.days.map((d) => (
                    <button
                      key={d.id}
                      className="btn block"
                      disabled={!d.exercises.length}
                      onClick={() => start({ planId: plan.id, weekId: w.id, dayId: d.id })}
                    >
                      {doneIds.has(d.id) ? <Icon name="check" size={16} /> : <Icon name="play" size={14} />}
                      <span className="grow">{d.name}</span>
                      <span className="muted small">{d.exercises.length} ćw.</span>
                    </button>
                  ))}
                </div>
              ))}
          </div>
        )
      })}
    </>
  )
}
