import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LiftPill } from '../components/LiftSelect'
import { LiftTiles } from '../components/LiftTiles'
import { exerciseHistory, loggedExerciseNames, personalRecords, weeklyVolume, type ExercisePoint } from '../lib/stats'
import { fmt, formatDate, shortDate } from '../lib/util'
import { useStore } from '../store'
import { LIFT_LABELS, LIFTS } from '../types'

type Metric = 'e1rm' | 'topWeight' | 'volume'
const METRICS: Record<Metric, string> = { e1rm: 'Szacowane 1RM', topWeight: 'Najcięższa seria', volume: 'Objętość (kg)' }

const axis = { stroke: 'var(--muted)', fontSize: 12, tickLine: false, axisLine: false }

function ChartTooltip({ active, payload, render }: { active?: boolean; payload?: { payload: unknown }[]; render: (p: never) => React.ReactNode }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip">{render(payload[0].payload as never)}</div>
}

const STACK = [...LIFTS, 'other'] as const
const STACK_LABEL = { ...LIFT_LABELS, other: 'Pozostałe' }

export function Progress() {
  const sessions = useStore((s) => s.sessions)
  const names = useMemo(() => loggedExerciseNames(sessions), [sessions])
  const records = useMemo(() => personalRecords(sessions), [sessions])
  const weeks = useMemo(() => weeklyVolume(sessions), [sessions])
  const [picked, setPicked] = useState<string>('')
  const [metric, setMetric] = useState<Metric>('e1rm')

  // Default to the first competition lift that has data.
  const exercise = picked || records.find((r) => r.lift)?.name || names[0] || ''
  const points = useMemo(() => (exercise ? exerciseHistory(sessions, exercise) : []), [sessions, exercise])

  if (!names.length)
    return (
      <>
        <h1>Postęp</h1>
        <div className="card empty">Zaloguj kilka treningów (odhacz wykonane serie), a tu pojawią się wykresy i rekordy.</div>
      </>
    )

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Postęp</h1>
          <p className="muted">e1RM liczone wzorem Epleya z uwzględnieniem RPE (powtórzenia w zapasie).</p>
        </div>
      </div>

      <LiftTiles sessions={sessions} />

      <div className="card stack">
        <div className="row between">
          <h2>{METRICS[metric]}</h2>
          <div className="row" style={{ gap: 6 }}>
            <select value={exercise} onChange={(e) => setPicked(e.target.value)}>
              {names.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <div className="tabs">
              {(Object.keys(METRICS) as Metric[]).map((m) => (
                <button key={m} className={`tab ${m === metric ? 'active' : ''}`} onClick={() => setMetric(m)}>
                  {m === 'e1rm' ? 'e1RM' : m === 'topWeight' ? 'Top' : 'Objętość'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {points.length < 2 && <p className="muted small">Potrzebujesz co najmniej dwóch treningów z tym ćwiczeniem, żeby zobaczyć trend.</p>}
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} {...axis} />
              <YAxis domain={['auto', 'auto']} {...axis} width={48} />
              <Tooltip
                cursor={{ stroke: 'var(--muted)', strokeDasharray: '3 3' }}
                content={
                  <ChartTooltip
                    render={(p: ExercisePoint) => (
                      <>
                        <div className="muted small">{formatDate(p.date)}</div>
                        <div>
                          <b>{fmt((metric === 'e1rm' ? p.e1rm : p[metric]) ?? 0)} kg</b> {metric === 'e1rm' ? 'e1RM' : metric === 'volume' ? 'objętości' : ''}
                        </div>
                        <div className="muted small">
                          top: {fmt(p.topWeight)}×{p.topReps}
                        </div>
                      </>
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--accent)' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card stack">
        <div className="row between">
          <h2>Objętość tygodniowa (kg)</h2>
          <div className="row small" style={{ gap: 12 }}>
            {STACK.map((k) => (
              <span key={k} className="row" style={{ gap: 5 }}>
                <span className="dot" style={{ background: `var(--${k})` }} />
                {STACK_LABEL[k]}
              </span>
            ))}
          </div>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={weeks} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} maxBarSize={44}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" tickFormatter={(w: string) => `od ${shortDate(w)}`} {...axis} />
              <YAxis {...axis} width={56} tickFormatter={(v: number) => fmt(v / 1000) + ' t'} />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                content={
                  <ChartTooltip
                    render={(w: (typeof weeks)[number]) => (
                      <>
                        <div className="muted small">Tydzień od {formatDate(w.week)}</div>
                        {STACK.map((k) => (
                          <div key={k} className="row" style={{ gap: 6 }}>
                            <span className="dot" style={{ background: `var(--${k})` }} />
                            <span className="grow">{STACK_LABEL[k]}</span>
                            <b>{fmt(w[k], 0)}</b>
                          </div>
                        ))}
                      </>
                    )}
                  />
                }
              />
              {STACK.map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  stackId="v"
                  fill={`var(--${k})`}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  radius={i === STACK.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card stack">
        <h2>Rekordy</h2>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Ćwiczenie</th>
                <th>Najcięższa seria</th>
                <th>Najlepsze e1RM</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.name} style={{ cursor: 'pointer' }} onClick={() => setPicked(r.name)}>
                  <td>
                    <span className="row" style={{ gap: 6 }}>
                      {r.name} <LiftPill lift={r.lift} />
                    </span>
                  </td>
                  <td>
                    {fmt(r.heaviest.weight, 2)} kg × {r.heaviest.reps} <span className="muted small">· {shortDate(r.heaviest.date)}</span>
                  </td>
                  <td>
                    {r.bestE1rm ? (
                      <>
                        {fmt(r.bestE1rm.value)} kg <span className="muted small">· {shortDate(r.bestE1rm.date)}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
