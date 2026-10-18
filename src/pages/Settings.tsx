import { useEffect, useRef, useState } from 'react'
import { exportData, requestPersistentStorage, useBackupMeta, type PersistState } from '../lib/backup'
import { useStore } from '../store'
import type { AppData } from '../types'

export function Settings() {
  const plans = useStore((s) => s.plans)
  const sessions = useStore((s) => s.sessions)
  const replaceAll = useStore((s) => s.replaceAll)
  const addSeedPlans = useStore((s) => s.addSeedPlans)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [persist, setPersist] = useState<PersistState | null>(null)
  const { lastExportAt } = useBackupMeta()

  useEffect(() => {
    requestPersistentStorage().then(setPersist)
  }, [])

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as AppData
      if (!Array.isArray(data.plans) || !Array.isArray(data.sessions)) throw new Error('zły format')
      if (!confirm(`Zastąpić obecne dane? Plik zawiera ${data.plans.length} planów i ${data.sessions.length} treningów.`)) return
      replaceAll(data)
      setMsg('Dane zaimportowane.')
    } catch (e) {
      setMsg(`Nie udało się wczytać pliku: ${(e as Error).message}`)
    }
  }

  return (
    <>
      <h1>Ustawienia</h1>
      <div className="card stack">
        <h2>Kopia zapasowa</h2>
        <p className="muted small">
          Dane są zapisane tylko w tej przeglądarce ({plans.length} planów, {sessions.length} treningów). Eksportuj je regularnie, żeby ich nie stracić
          i żeby przenieść je na inne urządzenie.
        </p>
        <p className="small">
          Ostatni eksport:{' '}
          {lastExportAt
            ? new Date(lastExportAt).toLocaleString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'jeszcze nie było'}
        </p>
        <div className="row">
          <button className="btn primary" onClick={() => exportData({ plans, sessions })}>
            Eksportuj JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Importuj JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
        {msg && <p className="small">{msg}</p>}
      </div>
      <div className="card stack" style={{ borderColor: 'var(--danger)' }}>
        <h2>Uwaga: czyszczenie danych Chrome</h2>
        <p className="small">
          Wyczyszczenie danych witryny <b style={{ overflowWrap: 'anywhere' }}>morzycrafal-darthproof.github.io</b> w Chrome (także przy czyszczeniu
          historii z zaznaczonymi „plikami cookie i danymi witryn”) <b>usuwa też wszystkie dane zainstalowanej aplikacji</b> — plany i treningi.
          Zanim cokolwiek wyczyścisz, zrób eksport JSON.
        </p>
        <p className="muted small">
          Trwała pamięć:{' '}
          {persist === null
            ? 'sprawdzanie…'
            : persist === 'persisted'
              ? 'włączona — przeglądarka nie usunie danych sama przy braku miejsca.'
              : persist === 'not-persisted'
                ? 'wyłączona — przeglądarka może sama usunąć dane przy braku miejsca. Zainstalowanie aplikacji na ekranie głównym zwykle to zmienia.'
                : 'ta przeglądarka jej nie obsługuje.'}
        </p>
      </div>
      <div className="card stack">
        <h2>Dane przykładowe</h2>
        <p className="muted small">Dodaje ponownie plany z rozpiski (blok siłowy, objętość, kulturystyczny).</p>
        <div>
          <button className="btn" onClick={() => (addSeedPlans(), setMsg('Dodano przykładowe plany.'))}>
            Dodaj przykładowe plany
          </button>
        </div>
      </div>
      <div className="card stack">
        <h2>Strefa niebezpieczna</h2>
        <div>
          <button
            className="btn danger"
            onClick={() => confirm('Usunąć wszystkie plany i treningi? Tego nie da się cofnąć.') && replaceAll({ plans: [], sessions: [] })}
          >
            Wyczyść wszystkie dane
          </button>
        </div>
      </div>
    </>
  )
}
