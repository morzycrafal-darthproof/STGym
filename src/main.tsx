import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Plans } from './pages/Plans'
import { PlanEditor } from './pages/PlanEditor'
import { StartWorkout } from './pages/StartWorkout'
import { Workout } from './pages/Workout'
import { History } from './pages/History'
import { Progress } from './pages/Progress'
import { Settings } from './pages/Settings'
import { requestPersistentStorage } from './lib/backup'
import './index.css'

// Ask the browser not to evict localStorage under storage pressure.
requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="plany" element={<Plans />} />
          <Route path="plany/:id" element={<PlanEditor />} />
          <Route path="trening" element={<StartWorkout />} />
          <Route path="trening/:id" element={<Workout />} />
          <Route path="historia" element={<History />} />
          <Route path="postep" element={<Progress />} />
          <Route path="ustawienia" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)

// Offline support and Android install; skipped in dev so Vite's hot reload isn't cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
}
