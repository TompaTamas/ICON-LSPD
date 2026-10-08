import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useApi } from '../lib/useApi.js';
import { loginUrl } from '../lib/api.js';
import { formatDate, formatDuration, formatTime, MONTHS } from '../lib/format.js';
import { Avatar, Markdown } from '../components/ui.jsx';

/** A másodperceket a betöltés óta helyben léptetjük, így az „eltelt idő” élőben fut. */
function useTicker() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function DispatchBoard() {
  const { data, error, loading } = useApi('/api/public/szolgalatban', { refreshMs: 30_000 });
  const now = useTicker();
  const units = data ?? [];
  return (
    <section aria-labelledby="szolgalatban-cim" className="overflow-hidden rounded-xl bg-[#0c1a33] text-white shadow-xl ring-1 ring-white/10">
      <div className="lightbar" aria-hidden="true" />
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 id="szolgalatban-cim" className="display text-3xl font-bold">Szolgálatban most</h2>
        <span className="flex items-center gap-2 text-sm text-white/70">
          <span className="live-dot" aria-hidden="true" />
          <span className="num">{units.length} egység</span>
        </span>
      </div>
      {loading && <p className="px-5 py-8 text-white/60">Csatlakozás a diszpécserhez…</p>}
      {error && <p className="px-5 py-8 text-white/60">A szolgálati lista most nem érhető el.</p>}
      {!loading && !error && units.length === 0 && (
        <p className="px-5 py-10 text-white/60">Jelenleg nincs egység szolgálatban.</p>
      )}
      <ul className="divide-y divide-white/10">
        {units.map((u) => {
          const seconds = (now - Date.parse(u.kezdes)) / 1000;
          return (
            <li key={`${u.hivojel}-${u.kezdes}`} className="grid grid-cols-[minmax(7rem,auto)_1fr_auto] items-center gap-4 px-5 py-3.5">
              <span className="display text-2xl font-bold text-gold">{u.hivojel ?? '—'}</span>
              <span className="truncate font-semibold">{u.nev}</span>
              <span className="text-right text-sm text-white/70 num">
                {formatTime(u.kezdes)} óta
                <span className="block font-semibold text-white">{formatDuration(seconds)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MemberStrip() {
  const announcements = useApi('/api/kozlemenyek');
  const birthdays = useApi('/api/szuletesnapok');
  const latest = (announcements.data ?? []).slice(0, 2);
  return (
    <section className="mt-14 grid gap-10 lg:grid-cols-[2fr_1fr]">
      <div>
        <h2 className="display mb-4 text-3xl font-bold">Legutóbbi közlemények</h2>
        {latest.length === 0 && <p className="text-steel">Még nincs közlemény.</p>}
        {latest.map((a) => (
          <article key={a.id} className="mb-6 border-l-4 border-gold pl-5">
            <h3 className="text-lg font-bold">{a.title}</h3>
            <p className="mb-2 text-sm text-steel">{formatDate(a.created_at)}{a.szerzo ? ` · ${a.szerzo}` : ''}</p>
            <Markdown text={a.content_md} />
          </article>
        ))}
        <Link to="/kozlemenyek" className="text-sm font-semibold text-uniform underline">Az összes közlemény</Link>
      </div>
      <div>
        <h2 className="display mb-4 text-3xl font-bold">Közelgő születésnapok</h2>
        {(birthdays.data ?? []).length === 0 && <p className="text-steel">Senki nem adta meg a születésnapját. A Profilomban vagy a <code>/szulinap</code> paranccsal teheted meg.</p>}
        <ul className="space-y-3">
          {(birthdays.data ?? []).map((b) => (
            <li key={`${b.nev}-${b.honap}-${b.nap}`} className="flex items-center gap-3">
              <Avatar src={b.avatar} name={b.nev} size={34} />
              <span className="flex-1">
                <span className="block font-semibold">{b.nev}</span>
                <span className="text-sm text-steel">{MONTHS[b.honap - 1]} {b.nap}.</span>
              </span>
              <span className={`text-sm font-semibold ${b.hany_nap === 0 ? 'text-gold' : 'text-steel'}`}>
                {b.hany_nap === 0 ? 'Ma! 🎂' : b.hany_nap === 1 ? 'Holnap' : `${b.hany_nap} nap múlva`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  const { user, can } = useAuth();
  const location = useLocation();
  return (
    <>
      <section className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div className="pt-4">
          <p className="font-semibold text-uniform">Los Santos Police Department</p>
          <h1 className="display mt-2 text-7xl font-extrabold text-ink sm:text-8xl">ICON LSPD</h1>
          <p className="mt-5 max-w-md text-lg text-steel">
            Szolgálati információk, a teljes Büntető Törvénykönyv bírság-kalkulátorral és időpontfoglalás a vezetőséghez, egy helyen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/btk" className="btn btn-primary">BTK megnyitása</Link>
            {user ? (
              <Link to={can('lspd') ? '/mdt' : '/idopontok'} className="btn btn-ghost">{can('lspd') ? 'MDT' : 'Időpontfoglalás'}</Link>
            ) : (
              <a href={loginUrl(location.pathname)} className="btn btn-ghost">Belépés Discorddal</a>
            )}
          </div>
        </div>
        <DispatchBoard />
      </section>

      <section className="mt-16 grid gap-8 border-t border-line pt-10 md:grid-cols-3">
        <div>
          <h2 className="display text-2xl font-bold">Büntető Törvénykönyv</h2>
          <p className="mt-2 text-steel">Fejezetekre bontva, kereshetően. A kalkulátor összeadja a bírságot és a börtönidőt, és MDT-be másolható összefoglalót készít.</p>
          <Link to="/btk" className="mt-3 inline-block font-semibold text-uniform underline">Ugrás a BTK-hoz</Link>
        </div>
        <div>
          <h2 className="display text-2xl font-bold">Csatlakoznál?</h2>
          <p className="mt-2 text-steel">Csatlakozni csak IC lehet. Foglalj időpontot felvételi interjúra; ha a vezetőség elfogadja, a bot privát üzenetben megírja, mikor és hol várunk.</p>
          <Link to="/idopontok" className="mt-3 inline-block font-semibold text-uniform underline">Felvételi időpont foglalása</Link>
        </div>
        <div>
          <h2 className="display text-2xl font-bold">Ügyed van?</h2>
          <p className="mt-2 text-steel">Kérdést, panaszt a Discord ticketek csatornájában nyithatsz. Személyes megbeszélésre időpontot is foglalhatsz.</p>
          <Link to="/idopontok" className="mt-3 inline-block font-semibold text-uniform underline">Időpontfoglalás</Link>
        </div>
      </section>

      {user && <MemberStrip />}
    </>
  );
}
