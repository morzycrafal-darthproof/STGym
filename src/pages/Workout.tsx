import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LiftPill, LiftSelect } from '../components/LiftSelect'
import { formatSets, formatTarget } from '../lib/format'
import { lastPerformance, sessionTonnage, setE1rm } from '../lib/stats'
import { clone, fmt, uid } from '../lib/util'
import { useStore } from '../store'
import type { LoggedExercise, Session } from '../types'
import { detectLift } from '../lib/parser'

function RestTimer({ since, onClose }: { since: number; onClose: () => void }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const sec = Math.max(0, Math.floor((now - since) / 1000))
  return (
    <button className="rest-timer" onClick={onClose} title="Czas od ostatniej serii – kliknij, aby ukryć">
      <Icon name="timer" size={16} />
      {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
    </button>
  )
}

export function Workout() {
  const { id } = useParams()
  const session = useStore((s) => s.sessions.find((x) => x.id === id))
  const sessions = useStore((s) => s.sessions)
  const saveSession = useStore((s) => s.saveSession)
  const deleteSession = useStore((s) => s.deleteSession)
  const navigate = useNavigate()
  const [restSince, setRestSince] = useState<number | null>(null)
  const [newExercise, setNewExercise] = useState('')

  if (!session) return <div className="card empty">Nie znaleziono treningu. <Link to="/trening">Wróć</Link></div>

  const update = (fn: (s: Session) => void) => {
    const s = clone(session)
    fn(s)
    saveSession(s)
  }

  const addExercise = () => {
    const name = newExercise.trim()
    if (!name) return
    update((s) =>
      s.exercises.push({
        id: uid(),
        name,
        lift: detectLift(name),
        superset: '',
        notes: '',
        target: [],
        sets: [{ weight: '', reps: '', rpe: '', done: false }],
      }),
    )
    setNewExercise('')
  }

  const total = session.exercises.reduce((t, e) => t + e.sets.length, 0)
  const done = session.exercises.reduce((t, e) => t + e.sets.filter((s) => s.done).length, 0)

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <Link to="/trening" className="muted small row" style={{ gap: 4 }}>
          <Icon name="back" size={14} /> Trening
        </Link>
        <input className="title-input" value={session.title} onChange={(e) => update((s) => (s.title = e.target.value))} />
        <div className="row">
          <input type="date" value={session.date} onChange={(e) => update((s) => (s.date = e.target.value))} />
          <span className="muted small">
            {done}/{total} serii · {fmt(sessionTonnage(session), 0)} kg objętości
          </span>
          {session.finishedAt && <span className="pill">Zakończony</span>}
        </div>
      </div>

      {session.exercises.map((ex, ei) => (
        <ExerciseLog
          key={ex.id}
          ex={ex}
          last={lastPerformance(sessions, ex.name, session)}
          onChange={(fn) => update((s) => fn(s.exercises[ei]))}
          onDelete={() => confirm(`Usunąć „${ex.name}” z treningu?`) && update((s) => s.exercises.splice(ei, 1))}
          onSetDone={() => setRestSince(Date.now())}
        />
      ))}

      <div className="card row">
        <input
          className="grow"
          list="logged-names"
          placeholder="Dodaj ćwiczenie spoza planu…"
          value={newExercise}
          onChange={(e) => setNewExercise(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addExercise()}
        />
        <button className="btn" onClick={addExercise} disabled={!newExercise.trim()}>
          <Icon name="plus" size={16} /> Dodaj
        </button>
      </div>

      <textarea rows={2} placeholder="Notatki z treningu (samopoczucie, sen, ból)…" value={session.notes} onChange={(e) => update((s) => (s.notes = e.target.value))} />

      <div className="row between">
        <button
          className="btn ghost danger"
          onClick={() => {
            if (!confirm('Usunąć ten trening?')) return
            deleteSession(session.id)
            navigate('/historia')
          }}
        >
          <Icon name="trash" size={16} /> Usuń trening
        </button>
        <button
          className="btn primary"
          onClick={() => {
            update((s) => (s.finishedAt = s.finishedAt ?? new Date().toISOString()))
            navigate('/')
          }}
        >
          <Icon name="check" size={16} /> {session.finishedAt ? 'Zapisz' : 'Zakończ trening'}
        </button>
      </div>

      <datalist id="logged-names">
        {[...new Set(sessions.flatMap((s) => s.exercises.map((e) => e.name)))].map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {restSince && <RestTimer since={restSince} onClose={() => setRestSince(null)} />}
    </>
  )
}

function ExerciseLog({
  ex,
  last,
  onChange,
  onDelete,
  onSetDone,
}: {
  ex: LoggedExercise
  last: ReturnType<typeof lastPerformance>
  onChange: (fn: (e: LoggedExercise) => void) => void
  onDelete: () => void
  onSetDone: () => void
}) {
  const best = ex.sets.filter((s) => s.done).reduce<number | null>((b, s) => {
    const v = setE1rm(s)
    return v !== null && (b === null || v > b) ? v : b
  }, null)

  return (
    <div className={`card stack ${ex.superset ? 'exercise in-ss' : ''}`} style={{ gap: 10 }}>
      <div className="row" style={{ gap: 8 }}>
        <div className="grow stack" style={{ gap: 2 }}>
          <div className="row" style={{ gap: 6 }}>
            <h3>{ex.name}</h3>
            <LiftPill lift={ex.lift} />
            {ex.superset && <span className="pill ss">Superseria {ex.superset}</span>}
          </div>
          {ex.target.length > 0 && <span className="small muted">Plan: {formatTarget(ex.target)}</span>}
          {ex.notes && <span className="small muted">{ex.notes}</span>}
          {last && <span className="small muted">Ostatnio: {formatSets(last)}</span>}
        </div>
        {!ex.target.length && <LiftSelect value={ex.lift} onChange={(lift) => onChange((x) => (x.lift = lift))} />}
        <button className="btn ghost icon danger" title="Usuń ćwiczenie" onClick={onDelete}>
          <Icon name="trash" size={16} />
        </button>
      </div>

      <div className="log-set head">
        <span>#</span>
        <span style={{ textAlign: 'center' }}>kg</span>
        <span style={{ textAlign: 'center' }}>powt.</span>
        <span style={{ textAlign: 'center' }}>RPE</span>
        <span />
      </div>
      {ex.sets.map((s, si) => {
        const t = ex.target[si]
        return (
          <div key={si} className="stack" style={{ gap: 2 }}>
            <div className={`log-set ${s.done ? 'done' : ''}`}>
              <span className="muted small" style={{ textAlign: 'center' }}>
                {si + 1}
              </span>
              <input inputMode="decimal" value={s.weight} placeholder={t?.weight || 'kg'} onChange={(e) => onChange((x) => (x.sets[si].weight = e.target.value))} />
              <input inputMode="numeric" value={s.reps} placeholder={t?.reps || 'powt.'} onChange={(e) => onChange((x) => (x.sets[si].reps = e.target.value))} />
              <input inputMode="decimal" value={s.rpe} placeholder={t?.rpe || 'RPE'} onChange={(e) => onChange((x) => (x.sets[si].rpe = e.target.value))} />
              <button
                className={`check ${s.done ? 'on' : ''}`}
                title={s.done ? 'Cofnij' : 'Seria zrobiona'}
                onClick={() => {
                  if (!s.done) onSetDone()
                  onChange((x) => (x.sets[si].done = !x.sets[si].done))
                }}
              >
                <Icon name="check" size={18} />
              </button>
            </div>
            {t && (t.reps.includes('–') || t.weight.includes('–')) && (
              <span className="target">
                cel: {t.reps} powt.{t.weight ? ` · ${t.weight} kg` : ''}
              </span>
            )}
          </div>
        )
      })}

      <div className="row between">
        <div className="row" style={{ gap: 4 }}>
          <button
            className="btn sm ghost"
            onClick={() =>
              onChange((x) => {
                const prev = x.sets[x.sets.length - 1]
                x.sets.push({ weight: prev?.weight ?? '', reps: prev?.reps ?? '', rpe: '', done: false })
              })
            }
          >
            <Icon name="plus" size={14} /> Seria
          </button>
          <button className="btn sm ghost" disabled={!ex.sets.length} onClick={() => onChange((x) => x.sets.pop())}>
            − Seria
          </button>
        </div>
        {best !== null && <span className="small muted">e1RM dziś: {fmt(best)} kg</span>}
      </div>
    </div>
  )
}
