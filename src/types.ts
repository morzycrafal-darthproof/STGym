export type Lift = 'squat' | 'bench' | 'deadlift'

export const LIFTS: Lift[] = ['squat', 'bench', 'deadlift']

export const LIFT_LABELS: Record<Lift, string> = {
  squat: 'Przysiad',
  bench: 'Wyciskanie',
  deadlift: 'Martwy ciąg',
}

/** Planned values are free text so they can hold ranges like "8–10" or "90–100". */
export interface PlannedSet {
  reps: string
  weight: string
  rpe: string
}

export interface PlannedExercise {
  id: string
  name: string
  /** Competition lift this exercise counts towards (for 1RM tracking). */
  lift: Lift | null
  /** Exercises sharing the same non-empty label form a superset. */
  superset: string
  notes: string
  sets: PlannedSet[]
}

export interface PlanDay {
  id: string
  name: string
  exercises: PlannedExercise[]
}

export interface PlanWeek {
  id: string
  name: string
  days: PlanDay[]
}

export interface Plan {
  id: string
  name: string
  notes: string
  weeks: PlanWeek[]
  createdAt: string
}

/** Logged values are kept as typed so inputs stay editable; parse with num(). */
export interface LoggedSet {
  weight: string
  reps: string
  rpe: string
  done: boolean
}

export interface LoggedExercise {
  id: string
  name: string
  lift: Lift | null
  superset: string
  notes: string
  target: PlannedSet[]
  sets: LoggedSet[]
}

export interface Session {
  id: string
  /** Local date, YYYY-MM-DD. */
  date: string
  title: string
  planId: string | null
  weekId: string | null
  dayId: string | null
  notes: string
  exercises: LoggedExercise[]
  finishedAt: string | null
}

export interface AppData {
  plans: Plan[]
  sessions: Session[]
}
