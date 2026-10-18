import type { Lift, LoggedSet, Session } from '../types'
import { normalizeName, num, weekStart } from './util'

/** Epley estimate, counting reps in reserve from RPE (RPE 8 × 5 reps ≈ 7 reps to failure). */
export function e1rm(weight: number | null, reps: number | null, rpe: number | null = null): number | null {
  if (!weight || !reps || reps < 1) return null
  const rir = rpe !== null && rpe >= 5 && rpe <= 10 ? 10 - rpe : 0
  const total = reps + rir
  return total <= 1 ? weight : weight * (1 + total / 30)
}

export function setE1rm(s: LoggedSet): number | null {
  return e1rm(num(s.weight), num(s.reps), num(s.rpe))
}

export function tonnage(sets: LoggedSet[]): number {
  return sets.filter((s) => s.done).reduce((t, s) => t + (num(s.weight) ?? 0) * (num(s.reps) ?? 0), 0)
}

export function sessionTonnage(s: Session): number {
  return s.exercises.reduce((t, e) => t + tonnage(e.sets), 0)
}

export function doneSets(s: Session): number {
  return s.exercises.reduce((t, e) => t + e.sets.filter((x) => x.done).length, 0)
}

export interface ExercisePoint {
  date: string
  sessionId: string
  e1rm: number | null
  topWeight: number
  topReps: number
  volume: number
}

function byDate(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => a.date.localeCompare(b.date))
}

export function exerciseHistory(sessions: Session[], name: string): ExercisePoint[] {
  const key = normalizeName(name)
  const points: ExercisePoint[] = []
  for (const s of byDate(sessions)) {
    const done = s.exercises.filter((e) => normalizeName(e.name) === key).flatMap((e) => e.sets.filter((x) => x.done))
    if (!done.length) continue
    let best: number | null = null
    let topWeight = 0
    let topReps = 0
    for (const set of done) {
      const est = setE1rm(set)
      if (est !== null && (best === null || est > best)) best = est
      const w = num(set.weight) ?? 0
      const r = num(set.reps) ?? 0
      if (w > topWeight || (w === topWeight && r > topReps)) {
        topWeight = w
        topReps = r
      }
    }
    points.push({ date: s.date, sessionId: s.id, e1rm: best, topWeight, topReps, volume: tonnage(done) })
  }
  return points
}

export interface LiftBest {
  value: number
  date: string
  set: LoggedSet
}

export function liftBest(sessions: Session[], lift: Lift): LiftBest | null {
  let best: LiftBest | null = null
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (e.lift !== lift) continue
      for (const set of e.sets) {
        if (!set.done) continue
        const v = setE1rm(set)
        if (v !== null && (!best || v > best.value)) best = { value: v, date: s.date, set }
      }
    }
  }
  return best
}

export function loggedExerciseNames(sessions: Session[]): string[] {
  const seen = new Map<string, string>()
  for (const s of sessions)
    for (const e of s.exercises)
      if (e.sets.some((x) => x.done) && !seen.has(normalizeName(e.name))) seen.set(normalizeName(e.name), e.name.trim())
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'pl'))
}

/** Completed sets from the most recent earlier session with this exercise, for "last time" hints. */
export function lastPerformance(sessions: Session[], name: string, current: Session): LoggedSet[] | null {
  const key = normalizeName(name)
  const earlier = byDate(sessions)
    .filter((s) => s.id !== current.id && s.date <= current.date)
    .reverse()
  for (const s of earlier) {
    const sets = s.exercises.filter((e) => normalizeName(e.name) === key).flatMap((e) => e.sets.filter((x) => x.done))
    if (sets.length) return sets
  }
  return null
}

export interface WeekVolume {
  week: string
  squat: number
  bench: number
  deadlift: number
  other: number
}

export function weeklyVolume(sessions: Session[]): WeekVolume[] {
  const weeks = new Map<string, WeekVolume>()
  for (const s of sessions) {
    const key = weekStart(s.date)
    const w = weeks.get(key) ?? { week: key, squat: 0, bench: 0, deadlift: 0, other: 0 }
    for (const e of s.exercises) w[e.lift ?? 'other'] += tonnage(e.sets)
    weeks.set(key, w)
  }
  return [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week))
}

export interface PersonalRecord {
  name: string
  lift: Lift | null
  heaviest: { weight: number; reps: number; date: string }
  bestE1rm: { value: number; date: string } | null
}

export function personalRecords(sessions: Session[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>()
  for (const s of sessions) {
    for (const e of s.exercises) {
      for (const set of e.sets) {
        if (!set.done) continue
        const w = num(set.weight)
        if (!w) continue
        const r = num(set.reps) ?? 0
        const key = normalizeName(e.name)
        const rec = map.get(key) ?? { name: e.name.trim(), lift: e.lift, heaviest: { weight: 0, reps: 0, date: s.date }, bestE1rm: null }
        if (w > rec.heaviest.weight || (w === rec.heaviest.weight && r > rec.heaviest.reps)) rec.heaviest = { weight: w, reps: r, date: s.date }
        const est = setE1rm(set)
        if (est !== null && (!rec.bestE1rm || est > rec.bestE1rm.value)) rec.bestE1rm = { value: est, date: s.date }
        if (e.lift) rec.lift = e.lift
        map.set(key, rec)
      }
    }
  }
  return [...map.values()].sort((a, b) => (a.lift ? 0 : 1) - (b.lift ? 0 : 1) || a.name.localeCompare(b.name, 'pl'))
}
