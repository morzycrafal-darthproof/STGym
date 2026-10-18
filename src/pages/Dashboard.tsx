import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LiftTiles } from '../components/LiftTiles'
import { dismissBackupReminder, exportData, needsBackupReminder, sessionsSince, useBackupMeta } from '../lib/backup'
import { doneSets, sessionTonnage } from '../lib/stats'
import { fmt, formatDate } from '../lib/util'
import { nextDay, useStore } from '../store'

export function Dashboard() {
  const plans = useStore((s) => s.plans)
  const sessions = useStore((s) => s.sessions)
  const startSession = useStore((s) => s.startSession)
  const navigate = useNavigate()
  const backup = useBackupMeta()
  const unsaved = sessionsSince(sessions, backup.lastExportAt)

  const recent = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const inProgress = recent.find((s) => !s.finishedAt)
  // Continue the plan trained most recently, or the first plan for a fresh start.
  const currentPlan = plans.find((p) => p.id === recent.find((s) => s.planId)?.planId) ?? plans[0]
  const next = currentPlan && nextDay(currentPlan, sessions)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pulpit</h1>
          <p className="muted">{sessions.length ? `${sessions.length} zalogowanych treningów` : 'Zacznij od pierwszego treningu z planu.'}</p>
        </div>
      </div>

      {needsBackupReminder(sessions, backup) && (
        <div className="card stack" style={{ borderColor: 'var(--danger)' }}>
          <div className="row between" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
            <div className="grow stack" style={{ gap: 2 }}>
              <h2>Zrób kopię zapasową</h2>
              <span className="muted small">
                {backup.lastExportAt ? `Ostatni eksport: ${formatDate(new Date(backup.lastExportAt).toLocaleDateString('sv-SE'))}.` : 'Nie było jeszcze eksportu.'}{' '}
                Treningi bez kopii: {unsaved}. Dane są zapisane tylko w tej przeglądarce.
              </span>
            </div>
            <button className="btn ghost icon" aria-label="Przypomnij później" title="Przypomnij później" onClick={dismissBackupReminder}>
              ✕
            </button>
          </div>
          <div>
            <button className="btn primary" onClick={() => exportData({ plans, sessions })}>
              Eksportuj kopię
            </button>
          </div>
        </div>
      )}

      {inProgress ? (
        <Link to={`/trening/${inProgress.id}`} className="card row" style={{ borderColor: 'var(--accent)' }}>
          <div className="grow stack" style={{ gap: 2 }}>
            <span className="muted small">Trening w trakcie</span>
            <h2>{inProgress.title}</h2>
          </div>
          <span className="btn primary">
            <Icon name="play" size={16} /> Kontynuuj
          </span>
        </Link>
      ) : next ? (
        <div className="card row">
          <div className="grow stack" style={{ gap: 2 }}>
            <span className="muted small">Następny trening · {currentPlan.name}</span>
            <h2>{next.day.name}</h2>
            <span className="muted small">
              {next.week.name} · {next.day.exercises.length} ćwiczeń
            </span>
          </div>
          <button
            className="btn primary"
            onClick={() => navigate(`/trening/${startSession({ planId: currentPlan.id, weekId: next.week.id, dayId: next.day.id })}`)}
          >
            <Icon name="play" size={16} /> Zacznij
          </button>
        </div>
      ) : (
        <div className="card row">
          <span className="grow muted">Brak zaplanowanego dnia. Dodaj plan lub kolejny tydzień.</span>
          <Link to="/plany" className="btn">
            Plany
          </Link>
        </div>
      )}

      <LiftTiles sessions={sessions} />

      <div className="stack">
        <div className="row between">
          <h2>Ostatnie treningi</h2>
          {sessions.length > 0 && (
            <Link to="/historia" className="muted small">
              Cała historia →
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="card empty">Tu pojawią się Twoje treningi.</div>
        ) : (
          <div className="card list">
            {recent.map((s) => (
              <Link to={`/trening/${s.id}`} className="list-item" key={s.id}>
                <div className="grow stack" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{s.title}</span>
                  <span className="muted small">
                    {formatDate(s.date)} · {doneSets(s)} serii · {fmt(sessionTonnage(s), 0)} kg
                  </span>
                </div>
                {!s.finishedAt && <span className="pill ss">W trakcie</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
