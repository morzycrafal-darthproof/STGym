import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LiftSelect } from '../components/LiftSelect'
import { detectLift } from '../lib/parser'
import { addToWeight, clone, num, uid } from '../lib/util'
import { useStore } from '../store'
import type { Plan, PlanDay, PlannedExercise, PlanWeek } from '../types'

function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

function copyWeek(week: PlanWeek, n: number, delta: number): PlanWeek {
  const w = clone(week)
  w.id = uid()
  w.name = `Tydzień ${n}`
  for (const d of w.days) {
    d.id = uid()
    for (const e of d.exercises) {
      e.id = uid()
      if (delta) for (const s of e.sets) if (s.weight) s.weight = addToWeight(s.weight, delta)
    }
  }
  return w
}

export function PlanEditor() {
  const { id } = useParams()
  const plan = useStore((s) => s.plans.find((p) => p.id === id))
  const plans = useStore((s) => s.plans)
  const savePlan = useStore((s) => s.savePlan)
  const startSession = useStore((s) => s.startSession)
  const navigate = useNavigate()
  const [weekIdx, setWeekIdx] = useState(0)
  const [increment, setIncrement] = useState('2,5')

  const exerciseNames = useMemo(() => {
    const names = new Set<string>()
    for (const p of plans) for (const w of p.weeks) for (const d of w.days) for (const e of d.exercises) if (e.name) names.add(e.name)
    return [...names].sort((a, b) => a.localeCompare(b, 'pl'))
  }, [plans])

  if (!plan) return <div className="card empty">Nie znaleziono planu. <Link to="/plany">Wróć do listy</Link></div>

  const update = (fn: (p: Plan) => void) => {
    const p = clone(plan)
    fn(p)
    savePlan(p)
  }
  const week = plan.weeks[Math.min(weekIdx, plan.weeks.length - 1)]
  const wi = plan.weeks.indexOf(week)

  const addWeek = (fromCopy: boolean) => {
    update((p) => {
      const n = p.weeks.length + 1
      p.weeks.push(
        fromCopy
          ? copyWeek(p.weeks[wi], n, num(increment) ?? 0)
          : { id: uid(), name: `Tydzień ${n}`, days: [{ id: uid(), name: 'Dzień 1', exercises: [] }] },
      )
    })
    setWeekIdx(plan.weeks.length)
  }

  const train = (day: PlanDay) => navigate(`/trening/${startSession({ planId: plan.id, weekId: week.id, dayId: day.id })}`)

  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <Link to="/plany" className="muted small row" style={{ gap: 4 }}>
          <Icon name="back" size={14} /> Plany
        </Link>
        <input className="title-input" value={plan.name} onChange={(e) => update((p) => (p.name = e.target.value))} />
        <textarea
          rows={1}
          placeholder="Notatki do planu (cel bloku, uwagi)…"
          value={plan.notes}
          onChange={(e) => update((p) => (p.notes = e.target.value))}
        />
      </div>

      <div className="row between">
        <div className="tabs">
          {plan.weeks.map((w, i) => (
            <button key={w.id} className={`tab ${i === wi ? 'active' : ''}`} onClick={() => setWeekIdx(i)}>
              {w.name.split(':')[0]}
            </button>
          ))}
          <button className="tab" onClick={() => addWeek(false)} title="Dodaj pusty tydzień">
            +
          </button>
        </div>
      </div>

      {week && (
        <div className="stack">
          <div className="card row name-row">
            <input className="bare grow" value={week.name} onChange={(e) => update((p) => (p.weeks[wi].name = e.target.value))} />
            <div className="controls">
              <span className="muted small">Kopiuj jako następny tydzień, ciężary +</span>
              <input style={{ width: 64 }} inputMode="decimal" value={increment} onChange={(e) => setIncrement(e.target.value)} />
              <span className="muted small">kg</span>
              <button className="btn sm" onClick={() => addWeek(true)}>
                <Icon name="copy" size={14} /> Duplikuj
              </button>
            <button
              className="btn ghost icon danger"
              title="Usuń tydzień"
              disabled={plan.weeks.length === 1}
              onClick={() => {
                if (!confirm(`Usunąć ${week.name}?`)) return
                update((p) => p.weeks.splice(wi, 1))
                setWeekIdx(Math.max(0, wi - 1))
              }}
            >
              <Icon name="trash" size={16} />
            </button>
            </div>
          </div>

          {week.days.map((day, di) => (
            <div className="card stack" key={day.id}>
              <div className="row name-row">
                <input className="bare grow" style={{ fontSize: '1.05rem' }} value={day.name} onChange={(e) => update((p) => (p.weeks[wi].days[di].name = e.target.value))} />
                <div className="controls">
                <button className="btn sm primary" onClick={() => train(day)} disabled={!day.exercises.length}>
                  <Icon name="play" size={14} /> Trenuj
                </button>
                <button className="btn ghost icon" title="Przesuń wyżej" onClick={() => update((p) => move(p.weeks[wi].days, di, -1))}>
                  <Icon name="up" size={16} />
                </button>
                <button className="btn ghost icon" title="Przesuń niżej" onClick={() => update((p) => move(p.weeks[wi].days, di, 1))}>
                  <Icon name="down" size={16} />
                </button>
                <button
                  className="btn ghost icon danger"
                  title="Usuń dzień"
                  onClick={() => confirm(`Usunąć ${day.name}?`) && update((p) => p.weeks[wi].days.splice(di, 1))}
                >
                  <Icon name="trash" size={16} />
                </button>
                </div>
              </div>

              {day.exercises.map((ex, ei) => (
                <ExerciseEditor
                  key={ex.id}
                  ex={ex}
                  index={ei}
                  onChange={(fn) => update((p) => fn(p.weeks[wi].days[di].exercises[ei]))}
                  onMove={(dir) => update((p) => move(p.weeks[wi].days[di].exercises, ei, dir))}
                  onDelete={() => update((p) => p.weeks[wi].days[di].exercises.splice(ei, 1))}
                />
              ))}

              <div>
                <button
                  className="btn sm"
                  onClick={() =>
                    update((p) =>
                      p.weeks[wi].days[di].exercises.push({
                        id: uid(),
                        name: '',
                        lift: null,
                        superset: '',
                        notes: '',
                        sets: Array.from({ length: 3 }, () => ({ reps: '', weight: '', rpe: '' })),
                      }),
                    )
                  }
                >
                  <Icon name="plus" size={14} /> Ćwiczenie
                </button>
              </div>
            </div>
          ))}

          <div>
            <button
              className="btn"
              onClick={() => update((p) => p.weeks[wi].days.push({ id: uid(), name: `Dzień ${p.weeks[wi].days.length + 1}`, exercises: [] }))}
            >
              <Icon name="plus" size={16} /> Dodaj dzień
            </button>
          </div>
        </div>
      )}

      <datalist id="exercise-names">
        {exerciseNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </>
  )
}

function ExerciseEditor({
  ex,
  index,
  onChange,
  onMove,
  onDelete,
}: {
  ex: PlannedExercise
  index: number
  onChange: (fn: (e: PlannedExercise) => void) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  return (
    <div className={`exercise stack ${ex.superset ? 'in-ss' : ''}`} style={{ gap: 8 }}>
      <div className="row ex-head" style={{ gap: 6 }}>
        <span className="muted small" style={{ width: 18 }}>
          {index + 1}.
        </span>
        <input
          className="grow"
          list="exercise-names"
          placeholder="Nazwa ćwiczenia"
          value={ex.name}
          onChange={(e) =>
            onChange((x) => {
              // Auto-tag competition lifts until the user picks one by hand.
              if (x.lift === detectLift(x.name)) x.lift = detectLift(e.target.value)
              x.name = e.target.value
            })
          }
          style={{ fontWeight: 600 }}
        />
        <div className="controls">
        <LiftSelect value={ex.lift} onChange={(lift) => onChange((x) => (x.lift = lift))} />
        <input
          style={{ width: 54 }}
          placeholder="SS"
          title="Superseria: ćwiczenia z tą samą literą wykonujesz naprzemiennie"
          value={ex.superset}
          onChange={(e) => onChange((x) => (x.superset = e.target.value.toUpperCase()))}
        />
        <button className="btn ghost icon" title="Wyżej" onClick={() => onMove(-1)}>
          <Icon name="up" size={16} />
        </button>
        <button className="btn ghost icon" title="Niżej" onClick={() => onMove(1)}>
          <Icon name="down" size={16} />
        </button>
        <button className="btn ghost icon danger" title="Usuń ćwiczenie" onClick={onDelete}>
          <Icon name="trash" size={16} />
        </button>
        </div>
      </div>

      <table className="sets-table">
        <thead>
          <tr>
            <th className="idx">#</th>
            <th>Powtórzenia</th>
            <th>Ciężar (kg)</th>
            <th>RPE</th>
            <th className="act" />
          </tr>
        </thead>
        <tbody>
          {ex.sets.map((s, si) => (
            <tr key={si}>
              <td className="idx">{si + 1}</td>
              <td>
                <input placeholder="np. 6 lub 8–10" value={s.reps} onChange={(e) => onChange((x) => (x.sets[si].reps = e.target.value))} />
              </td>
              <td>
                <input inputMode="decimal" placeholder="—" value={s.weight} onChange={(e) => onChange((x) => (x.sets[si].weight = e.target.value))} />
              </td>
              <td>
                <input inputMode="decimal" placeholder="—" value={s.rpe} onChange={(e) => onChange((x) => (x.sets[si].rpe = e.target.value))} />
              </td>
              <td className="act">
                <button className="btn ghost icon" title="Usuń serię" onClick={() => onChange((x) => x.sets.splice(si, 1))}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row">
        <button
          className="btn sm ghost"
          onClick={() => onChange((x) => x.sets.push(x.sets.length ? { ...x.sets[x.sets.length - 1] } : { reps: '', weight: '', rpe: '' }))}
        >
          <Icon name="plus" size={14} /> Seria
        </button>
        <input
          className="grow small"
          placeholder="Notatka (tempo, pauza, wskazówki techniczne)…"
          value={ex.notes}
          onChange={(e) => onChange((x) => (x.notes = e.target.value))}
        />
      </div>
    </div>
  )
}
