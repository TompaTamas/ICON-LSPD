import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { loginUrl } from '../lib/api.js';
import { Avatar, Logo } from './ui.jsx';

/** Menüpontok és a megjelenésükhöz szükséges szint (null = mindenki). */
const NAV = [
  { to: '/btk', label: 'BTK', level: null },
  { to: '/szabalyzat', label: 'Szabályzat', level: 'tag' },
  { to: '/mdt', label: 'MDT', level: 'lspd' },
  { to: '/szolgalat', label: 'Szolgálat', level: 'lspd' },
  { to: '/allomany', label: 'Állomány', level: 'lspd' },
  { to: '/idopontok', label: 'Időpontok', level: 'tag' },
  { to: '/kozlemenyek', label: 'Közlemények', level: 'tag' },
];
const MORE = [
  { to: '/ticketek', label: 'Ticketjeim', level: 'tag' },
  { to: '/szabadsag', label: 'Szabadság', level: 'lspd' },
  { to: '/profil', label: 'Profilom', level: 'tag' },
  { to: '/admin', label: 'Vezetői felület', level: 'vezeto' },
];

function UserMenu() {
  const { user, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10" aria-expanded={open}>
        <Avatar src={user.avatar} name={user.nev} size={30} />
        <span className="hidden text-left text-sm leading-tight lg:block">
          <span className="block font-semibold">{user.nev}</span>
          <span className="block text-xs text-white/60">{user.rendfokozat ?? 'Tag'}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-sheet text-ink shadow-xl" onClick={() => setOpen(false)}>
          {MORE.filter((m) => can(m.level)).map((m) => (
            <Link key={m.to} to={m.to} className="block px-4 py-2.5 text-sm hover:bg-paper">{m.label}</Link>
          ))}
          <button type="button" onClick={logout} className="block w-full border-t border-line px-4 py-2.5 text-left text-sm text-siren-red hover:bg-paper">Kijelentkezés</button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, can, status } = useAuth();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const items = NAV.filter((n) => !n.level || can(n.level));

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#tartalom" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-sheet focus:px-3 focus:py-2">Ugrás a tartalomra</a>
      <header className="sticky top-0 z-20 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3" aria-label="ICON LSPD – főoldal">
            <Logo size={38} />
            <span className="display text-2xl font-extrabold tracking-wide">ICON LSPD</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Fő menü">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-white/10 text-gold' : 'text-white/80 hover:text-white'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <UserMenu />
            ) : status !== 'loading' ? (
              <a href={loginUrl(location.pathname)} className="btn btn-gold btn-sm">Belépés Discorddal</a>
            ) : null}
            <button type="button" className="btn btn-sm border border-white/20 md:hidden" onClick={() => setMobile((m) => !m)} aria-expanded={mobile} aria-label="Menü">☰</button>
          </div>
        </div>
        {mobile && (
          <nav className="border-t border-white/10 px-4 pb-4 md:hidden" aria-label="Mobil menü" onClick={() => setMobile(false)}>
            {[...items, ...(user ? MORE.filter((m) => can(m.level)) : [])].map((n) => (
              <NavLink key={n.to} to={n.to} className="block rounded px-2 py-2.5 text-sm font-semibold text-white/85">{n.label}</NavLink>
            ))}
          </nav>
        )}
      </header>

      <main id="tartalom" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-sheet">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-steel sm:px-6">
          <span className="flex items-center gap-2"><Logo size={22} /> ICON LSPD · Los Santos Police Department</span>
          <span>Szerepjátékhoz készült oldal. Minden szereplő és esemény kitalált.</span>
        </div>
      </footer>
    </div>
  );
}
