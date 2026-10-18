import { Link } from 'react-router-dom'
import { doneSets, sessionTonnage } from '../lib/stats'
import { fmt, formatDate } from '../lib/util'
import { useStore } from '../store'

export function History() {
  const sessions = useStore((s) => s.sessions)
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Historia</h1>
          <p className="muted">Kliknij trening, żeby go przejrzeć lub poprawić.</p>
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="card empty">Brak zalogowanych treningów.</div>
      ) : (
        <div className="card list">
          {sorted.map((s) => {
            const names = s.exercises.filter((e) => e.sets.some((x) => x.done)).map((e) => e.name)
            return (
              <Link to={`/trening/${s.id}`} className="list-item" key={s.id}>
                <div className="grow stack" style={{ gap: 2 }}>
                  <span className="muted small">{formatDate(s.date)}</span>
                  <span style={{ fontWeight: 600 }}>{s.title}</span>
                  <span className="muted small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {names.join(' · ') || 'brak wykonanych serii'}
                  </span>
                </div>
                <div className="stack small" style={{ gap: 0, textAlign: 'right' }}>
                  <span>{doneSets(s)} serii</span>
                  <span className="muted">{fmt(sessionTonnage(s), 0)} kg</span>
                </div>
                {!s.finishedAt && <span className="pill ss">W trakcie</span>}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
