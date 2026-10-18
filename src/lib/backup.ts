import { useSyncExternalStore } from 'react'
import type { AppData, Session } from '../types'
import { today } from './util'

// Kept outside 'stgym-v1' so importing or clearing workout data doesn't reset the backup history.
const KEY = 'stgym-backup'
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000

interface BackupMeta {
  /** ISO timestamp of the last JSON export. */
  lastExportAt: string | null
  /** ISO timestamp of the last time the dashboard reminder was dismissed. */
  dismissedAt: string | null
}

const listeners = new Set<() => void>()
let cached: BackupMeta | null = null

function read(): BackupMeta {
  if (cached) return cached
  try {
    cached = { lastExportAt: null, dismissedAt: null, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    cached = { lastExportAt: null, dismissedAt: null }
  }
  return cached!
}

function write(patch: Partial<BackupMeta>) {
  cached = { ...read(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(cached))
  } catch {
    // Storage full or blocked; the reminder just keeps showing.
  }
  listeners.forEach((l) => l())
}

export function useBackupMeta(): BackupMeta {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
  )
}

/** Downloads all data as a JSON file and records the export time. */
export function exportData(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `stgym-${today()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  write({ lastExportAt: new Date().toISOString() })
}

export function dismissBackupReminder() {
  write({ dismissedAt: new Date().toISOString() })
}

/** Sessions started or finished after the given export time; all of them if there was no export. */
export function sessionsSince(sessions: Session[], exportAt: string | null): number {
  if (!exportAt) return sessions.length
  const exportDay = new Date(exportAt).toLocaleDateString('sv-SE') // local YYYY-MM-DD, like Session.date
  return sessions.filter((s) => s.date > exportDay || (s.finishedAt !== null && s.finishedAt > exportAt)).length
}

/** Remind when there is unexported work and the last export (and last dismissal) is over a week old. */
export function needsBackupReminder(sessions: Session[], meta: BackupMeta, now = Date.now()): boolean {
  if (sessionsSince(sessions, meta.lastExportAt) === 0) return false
  const old = (iso: string | null) => !iso || now - Date.parse(iso) > REMIND_AFTER_MS
  return old(meta.lastExportAt) && old(meta.dismissedAt)
}

export type PersistState = 'persisted' | 'not-persisted' | 'unsupported'

let persistResult: Promise<PersistState> | null = null

/** Asks the browser not to evict our storage. Safe to call repeatedly; the request runs once. */
export function requestPersistentStorage(): Promise<PersistState> {
  persistResult ??= (async () => {
    if (!navigator.storage?.persist) return 'unsupported'
    try {
      if (await navigator.storage.persisted()) return 'persisted'
      return (await navigator.storage.persist()) ? 'persisted' : 'not-persisted'
    } catch {
      return 'not-persisted'
    }
  })()
  return persistResult
}
