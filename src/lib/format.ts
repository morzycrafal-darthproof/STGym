import type { LoggedSet, PlannedSet } from '../types'

/** "4 × 6 · 105/110/115/120 kg · RPE 6.5–7" */
export function formatTarget(sets: PlannedSet[]): string {
  if (!sets.length) return ''
  const reps = [...new Set(sets.map((s) => s.reps).filter(Boolean))]
  const weights = sets.map((s) => s.weight).filter(Boolean)
  const rpe = [...new Set(sets.map((s) => s.rpe).filter(Boolean))]
  const parts = [`${sets.length} × ${reps.length ? reps.join('/') : '?'}`]
  if (weights.length) parts.push(`${new Set(weights).size === 1 ? weights[0] : weights.join('/')} kg`)
  if (rpe.length) parts.push(`RPE ${rpe.join('/')}`)
  return parts.join(' · ')
}

/** "120×6 @7, 120×6" */
export function formatSets(sets: LoggedSet[]): string {
  return sets.map((s) => `${s.weight || '—'}×${s.reps || '—'}${s.rpe ? ` @${s.rpe}` : ''}`).join(', ')
}
