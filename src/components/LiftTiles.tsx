import { liftBest } from '../lib/stats'
import { fmt, formatDate } from '../lib/util'
import { LIFT_LABELS, LIFTS, type Session } from '../types'

export function LiftTiles({ sessions }: { sessions: Session[] }) {
  const bests = LIFTS.map((l) => ({ lift: l, best: liftBest(sessions, l) }))
  const total = bests.every((b) => b.best) ? bests.reduce((t, b) => t + b.best!.value, 0) : null

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
      {bests.map(({ lift, best }) => (
        <div className="card stat" key={lift}>
          <div className="label">
            <span className="dot" style={{ background: `var(--${lift})` }} />
            {LIFT_LABELS[lift]} · e1RM
          </div>
          <div className="value">
            {best ? fmt(best.value) : '—'}
            <small>kg</small>
          </div>
          <div className="muted small">
            {best ? `${best.set.weight}×${best.set.reps}${best.set.rpe ? ` @${best.set.rpe}` : ''} · ${formatDate(best.date)}` : 'brak serii'}
          </div>
        </div>
      ))}
      <div className="card stat">
        <div className="label">Suma (total) · e1RM</div>
        <div className="value">
          {total !== null ? fmt(total) : '—'}
          <small>kg</small>
        </div>
        <div className="muted small">przysiad + ławka + martwy</div>
      </div>
    </div>
  )
}
