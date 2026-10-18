import type { Lift, Plan, PlanDay, PlannedExercise, PlannedSet, PlanWeek } from '../types'
import { normalizeName, uid } from './util'

/**
 * Parses a training program written as plain text, in the style of rozpiska.md:
 *
 *   Tydzień 1: Rozruch
 *   Dzień 1: Przysiad + Ławka
 *   Przysiad ze sztangą: 4 serie x 6 powtórzeń – 105/110/115/120 kg (ok. RPE 6.5–7)
 *   Ława 4x8 + podciąganie
 *   Superserie (3 serie):
 *   Ściąganie linki + rozpiętki 10–12 powtórzeń
 *
 * Lines that are only a number or "*" (list numbering) are ignored.
 */

const DEFAULT_SETS = 3
const N = String.raw`\d+(?:[.,]\d+)?`
const RANGE = String.raw`${N}(?:\s*[–—-]\s*${N})?`

const LONG = new RegExp(String.raw`^(.*?)\s*:\s*(\d+)\s*seri\S*\s*[x×]\s*(${RANGE})\s*powt\S*\s*(.*)$`, 'i')
const SHORT = new RegExp(String.raw`^(.*?)\s+(\d+)\s*[x×*]\s*(${RANGE})(?![\d.,]|\s*kg)\s*(.*)$`, 'i')
const REPS_ONLY = new RegExp(String.raw`^(.*?)[\s:(]+(${N}(?:\s*[–—/-]\s*${N})?)\s*powt\S*\)?\s*(.*)$`, 'i')
const LOAD = new RegExp(String.raw`(${RANGE}(?:\s*\/\s*${RANGE})*)\s*kg`, 'i')
const RPE = new RegExp(String.raw`RPE\s*(${RANGE})`, 'i')

function dash(s: string): string {
  return s.replace(/\s+/g, '').replace(/[—-]/g, '–')
}

function cleanLine(line: string): string {
  return line
    .replace(/[​﻿]/g, '')
    .replace(/\\([+*()~\-_#.])/g, '$1')
    .trim()
}

export function detectLift(name: string): Lift | null {
  const n = normalizeName(name)
  if (/pauz|tempo|przedni|front|deficyt|deficit|podwyższ|wąsk|close|rdl|rumuń|hantl|trap|atg|bułgar|suwnic/.test(n)) return null
  if (/^przysiad/.test(n)) return 'squat'
  if (/^(wyciskanie (na ławce|leżąc)|ława|ławka|bench)/.test(n)) return 'bench'
  if (/^martwy ciąg/.test(n)) return 'deadlift'
  return null
}

function parseLoad(rest: string): { weights: string[]; rpe: string } {
  let r = rest.replace(/^[\s–—-]+/, '')
  let rpe = ''
  const rm = r.match(RPE)
  if (rm) {
    rpe = dash(rm[1])
    r = r.replace(rm[0], ' ')
  }
  const wm = r.match(LOAD)
  const weights = wm ? wm[1].split('/').map(dash).filter(Boolean) : []
  return { weights, rpe }
}

function buildExercise(name: string, setCount: number, reps: string, rest: string): PlannedExercise {
  const { weights, rpe } = parseLoad(rest)
  const sets: PlannedSet[] = Array.from({ length: setCount }, (_, i) => ({
    reps,
    weight: weights[i] ?? weights[weights.length - 1] ?? '',
    rpe,
  }))
  // Keep the original prescription when the weights don't map one-to-one onto the sets.
  const mismatch = weights.length > 1 && weights.length !== setCount
  const cleanName = name.replace(/[\s:–—-]+$/, '').trim()
  return {
    id: uid(),
    name: cleanName,
    lift: detectLift(cleanName),
    superset: '',
    notes: mismatch ? `W rozpisce: ${setCount} serie, ciężary ${weights.join(' / ')} kg` : '',
    sets,
  }
}

export function parseExerciseLine(line: string, defaultSets = DEFAULT_SETS): PlannedExercise {
  let m = line.match(LONG)
  if (m) return buildExercise(m[1], parseInt(m[2]), dash(m[3]), m[4])
  m = line.match(SHORT)
  if (m) return buildExercise(`${m[1]} ${m[4]}`.trim(), parseInt(m[2]), dash(m[3]), '')
  m = line.match(REPS_ONLY)
  if (m) return buildExercise(m[1], defaultSets, dash(m[2]).replace('/', '–'), m[3])
  const kg = line.match(new RegExp(String.raw`[\s–—-]*${N}\s*kg`, 'i'))
  if (kg && kg.index) return buildExercise(line.slice(0, kg.index), defaultSets, '', line.slice(kg.index))
  return buildExercise(line, defaultSets, '', '')
}

export function parsePlanText(text: string, name: string, notes = ''): Plan {
  const weeks: PlanWeek[] = []
  let week: PlanWeek | null = null
  let day: PlanDay | null = null
  let superset = ''
  let supersetSets = DEFAULT_SETS
  let supersetCount = 0

  const ensureWeek = () => {
    if (!week) {
      week = { id: uid(), name: 'Tydzień 1', days: [] }
      weeks.push(week)
    }
    return week
  }
  const ensureDay = () => {
    if (!day) {
      const w = ensureWeek()
      day = { id: uid(), name: `Dzień ${w.days.length + 1}`, exercises: [] }
      w.days.push(day)
    }
    return day
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = cleanLine(raw)
    if (!line || /^\d+\.?$/.test(line) || line === '*') continue

    if (/^tydzie[nń](?=[\s\d:]|$)/i.test(line)) {
      week = { id: uid(), name: line, days: [] }
      weeks.push(week)
      day = null
      superset = ''
      continue
    }
    if (/^dzie[nń]\s*\d+/i.test(line)) {
      day = { id: uid(), name: line.replace(/:\s*$/, ''), exercises: [] }
      ensureWeek().days.push(day)
      superset = ''
      continue
    }
    if (/superseri/i.test(line)) {
      superset = String.fromCharCode(65 + supersetCount++)
      supersetSets = parseInt(line.match(/(\d+)\s*seri/i)?.[1] ?? '') || DEFAULT_SETS
      continue
    }

    const ex = parseExerciseLine(line, superset ? supersetSets : DEFAULT_SETS)
    ex.superset = superset
    ensureDay().exercises.push(ex)
  }

  return { id: uid(), name, notes, weeks, createdAt: new Date().toISOString() }
}
