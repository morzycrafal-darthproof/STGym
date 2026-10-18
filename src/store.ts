import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedPlans } from './seed'
import type { AppData, LoggedExercise, Plan, PlannedExercise, Session } from './types'
import { fmt, num, today, uid } from './lib/util'

interface Store extends AppData {
  savePlan: (plan: Plan) => void
  deletePlan: (id: string) => void
  startSession: (from?: { planId: string; weekId: string; dayId: string }) => string
  saveSession: (session: Session) => void
  deleteSession: (id: string) => void
  replaceAll: (data: AppData) => void
  addSeedPlans: () => void
}

/** Turns a planned exercise into a log entry prefilled with the target numbers. */
export function toLogged(ex: PlannedExercise): LoggedExercise {
  return {
    id: uid(),
    name: ex.name,
    lift: ex.lift,
    superset: ex.superset,
    notes: ex.notes,
    target: ex.sets,
    sets: ex.sets.map((s) => {
      const w = num(s.weight)
      const r = num(s.reps)
      return { weight: w === null ? '' : fmt(w, 2), reps: r === null ? '' : String(r), rpe: '', done: false }
    }),
  }
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      plans: seedPlans(),
      sessions: [],

      savePlan: (plan) =>
        set((s) => ({
          plans: s.plans.some((p) => p.id === plan.id) ? s.plans.map((p) => (p.id === plan.id ? plan : p)) : [...s.plans, plan],
        })),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      startSession: (from) => {
        const plan = from && get().plans.find((p) => p.id === from.planId)
        const week = plan && plan.weeks.find((w) => w.id === from.weekId)
        const day = week && week.days.find((d) => d.id === from.dayId)
        const session: Session = {
          id: uid(),
          date: today(),
          title: day ? `${plan.name} · ${week.name.split(':')[0]} · ${day.name.split(':')[0]}` : 'Trening',
          planId: day ? from.planId : null,
          weekId: day ? from.weekId : null,
          dayId: day ? from.dayId : null,
          notes: '',
          exercises: day ? day.exercises.map(toLogged) : [],
          finishedAt: null,
        }
        set((s) => ({ sessions: [...s.sessions, session] }))
        return session.id
      },
      saveSession: (session) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === session.id ? session : x)) })),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      replaceAll: (data) => set({ plans: data.plans, sessions: data.sessions }),
      addSeedPlans: () => set((s) => ({ plans: [...s.plans, ...seedPlans()] })),
    }),
    {
      name: 'stgym-v1',
      version: 1,
      partialize: (s) => ({ plans: s.plans, sessions: s.sessions }),
    },
  ),
)

/** Next day to train in a plan: the first one, in plan order, without a logged session. */
export function nextDay(plan: Plan, sessions: Session[]) {
  const done = new Set(sessions.filter((s) => s.planId === plan.id).map((s) => s.dayId))
  for (const week of plan.weeks) for (const day of week.days) if (!done.has(day.id)) return { week, day }
  return null
}
