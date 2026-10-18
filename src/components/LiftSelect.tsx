import { LIFT_LABELS, LIFTS, type Lift } from '../types'

export function LiftSelect({ value, onChange }: { value: Lift | null; onChange: (lift: Lift | null) => void }) {
  return (
    <select
      value={value ?? ''}
      title="Bój główny, do którego liczy się szacowane 1RM"
      onChange={(e) => onChange((e.target.value || null) as Lift | null)}
      style={{ width: 'auto' }}
    >
      <option value="">Akcesoria</option>
      {LIFTS.map((l) => (
        <option key={l} value={l}>
          {LIFT_LABELS[l]}
        </option>
      ))}
    </select>
  )
}

export function LiftPill({ lift }: { lift: Lift | null }) {
  if (!lift) return null
  return <span className={`pill ${lift}`}>{LIFT_LABELS[lift]}</span>
}
