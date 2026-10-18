import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { parsePlanText } from '../lib/parser'
import { clone, uid } from '../lib/util'
import { useStore } from '../store'
import type { Plan } from '../types'

const EXAMPLE = `Tydzień 1
Dzień 1: Przysiad
Przysiad ze sztangą: 4 serie x 6 powtórzeń – 105/110/115/120 kg (RPE 7)
Wyciskanie z pauzą: 4 serie x 8 powtórzeń – 75/77,5/80/82,5 kg
Wiosłowanie 4x10`

export function Plans() {
  const plans = useStore((s) => s.plans)
  const sessions = useStore((s) => s.sessions)
  const savePlan = useStore((s) => s.savePlan)
  const deletePlan = useStore((s) => s.deletePlan)
  const navigate = useNavigate()
  const [importing, setImporting] = useState(false)
  const [text, setText] = useState('')
  const [name, setName] = useState('')

  const createEmpty = () => {
    const plan: Plan = {
      id: uid(),
      name: 'Nowy plan',
      notes: '',
      createdAt: new Date().toISOString(),
      weeks: [{ id: uid(), name: 'Tydzień 1', days: [{ id: uid(), name: 'Dzień 1', exercises: [] }] }],
    }
    savePlan(plan)
    navigate(`/plany/${plan.id}`)
  }

  const importText = () => {
    const plan = parsePlanText(text, name.trim() || 'Zaimportowany plan')
    savePlan(plan)
    navigate(`/plany/${plan.id}`)
  }

  const duplicate = (p: Plan) => {
    const copy = clone(p)
    copy.id = uid()
    copy.name = `${p.name} (kopia)`
    copy.createdAt = new Date().toISOString()
    for (const w of copy.weeks) {
      w.id = uid()
      for (const d of w.days) {
        d.id = uid()
        for (const e of d.exercises) e.id = uid()
      }
    }
    savePlan(copy)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Plany treningowe</h1>
          <p className="muted">Rozpisz tygodnie, dni i serie. Zmiany zapisują się automatycznie.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setImporting((v) => !v)}>
            Importuj z tekstu
          </button>
          <button className="btn primary" onClick={createEmpty}>
            <Icon name="plus" size={16} /> Nowy plan
          </button>
        </div>
      </div>

      {importing && (
        <div className="card stack">
          <h2>Import rozpiski</h2>
          <p className="muted small">
            Wklej rozpiskę w formacie „Nazwa: 4 serie x 6 powtórzeń – 100/105/110/115 kg (RPE 7)”. Nagłówki „Tydzień N” i „Dzień N” dzielą plan,
            „Superserie (3 serie):” grupuje kolejne ćwiczenia, krótki zapis „4x8” też działa.
          </p>
          <input placeholder="Nazwa planu" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea rows={10} placeholder={EXAMPLE} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row">
            <button className="btn primary" disabled={!text.trim()} onClick={importText}>
              Utwórz plan
            </button>
            <button className="btn ghost" onClick={() => setImporting(false)}>
              Anuluj
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="card empty">Nie masz jeszcze planów. Utwórz nowy albo zaimportuj rozpiskę.</div>
      ) : (
        <div className="card list">
          {plans.map((p) => {
            const days = p.weeks.reduce((t, w) => t + w.days.length, 0)
            const done = sessions.filter((s) => s.planId === p.id).length
            return (
              <div className="list-item" key={p.id}>
                <Link to={`/plany/${p.id}`} className="grow stack" style={{ gap: 2 }}>
                  <h3>{p.name}</h3>
                  <span className="muted small">
                    {p.weeks.length} {p.weeks.length === 1 ? 'tydzień' : 'tyg.'} · {days} dni treningowych · wykonano {done}
                  </span>
                </Link>
                <button className="btn ghost icon" title="Duplikuj plan" onClick={() => duplicate(p)}>
                  <Icon name="copy" size={16} />
                </button>
                <button
                  className="btn ghost icon danger"
                  title="Usuń plan"
                  onClick={() => confirm(`Usunąć plan „${p.name}”? Zalogowane treningi zostaną.`) && deletePlan(p.id)}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
