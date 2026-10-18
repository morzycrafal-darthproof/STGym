import { NavLink, Outlet } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Pulpit', icon: 'home' },
  { to: '/plany', label: 'Plany', icon: 'list' },
  { to: '/trening', label: 'Trening', icon: 'dumbbell' },
  { to: '/historia', label: 'Historia', icon: 'calendar' },
  { to: '/postep', label: 'Postęp', icon: 'chart' },
]

export function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={26} height={26} />
          <span>
            ST<b>Gym</b>
          </span>
        </NavLink>
        <nav className="nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              <Icon name={l.icon} size={16} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <NavLink to="/ustawienia" className="btn ghost icon" title="Ustawienia i kopia zapasowa">
          <Icon name="settings" size={18} />
        </NavLink>
      </header>
      <main>
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}>
            <Icon name={l.icon} size={20} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
