import { useRef, useState } from 'react'
import { today } from '../lib/util'
import { useStore } from '../store'
import type { AppData } from '../types'

export function Settings() {
  const plans = useStore((s) => s.plans)
  const sessions = useStore((s) => s.sessions)
  const replaceAll = useStore((s) => s.replaceAll)
  const addSeedPlans = useStore((s) => s.addSeedPlans)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ plans, sessions } satisfies AppData, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `stgym-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

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
        <div className="row">
          <button className="btn primary" onClick={exportData}>
            Eksportuj JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Importuj JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
        {msg && <p className="small">{msg}</p>}
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
