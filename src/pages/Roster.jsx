import { useState } from 'react';
import { useApi } from '../lib/useApi.js';
import { Avatar, Empty, ErrorNote, Loading, PageHeader, Pill } from '../components/ui.jsx';

/** Az osztályok rövid neve a jelvényekhez. */
const SHORT = {
  'Special Weapons & Tactics (S.W.A.T)': 'SWAT',
  'Criminal Investigations Team (C.I.T)': 'CIT',
  'Canine Unit (K9)': 'K9',
  'Metro Division': 'Metro',
  'Traffic Enforcement Unit (T.E.U)': 'TEU',
  'Aerial and Maritime Division': 'AMD',
  'Internal Affairs': 'IA',
  'LSPD | Recruitment Office': 'Toborzás',
};

export default function Roster() {
  const { data, error, loading } = useApi('/api/allomany', { refreshMs: 60_000 });
  const [query, setQuery] = useState('');
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  const needle = query.trim().toLowerCase();
  const groups = data.map((g) => ({ ...g, tagok: g.tagok.filter((t) => !needle || t.nev.toLowerCase().includes(needle)) })).filter((g) => g.tagok.length);
  const total = data.reduce((n, g) => n + g.tagok.length, 0);
  const onDuty = data.reduce((n, g) => n + g.tagok.filter((t) => t.szolgalatban).length, 0);

  return (
    <>
      <PageHeader
        title="Állomány"
        intro={`${total} LSPD-tag, rendfokozat szerint. Most ${onDuty} fő van szolgálatban. A lista a Discord-rangokból készül.`}
        actions={<input type="search" className="input w-64" placeholder="Név keresése…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Név keresése" />}
      />
      {groups.length === 0 && <Empty title="Nincs találat" />}
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.rang}>
            <h2 className="display mb-3 flex items-baseline gap-3 text-2xl font-bold">
              {g.rang}
              <span className="text-base font-semibold text-mute num">{g.tagok.length}</span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.tagok.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line bg-sheet px-3 py-2.5">
                  <Avatar src={t.avatar} name={t.nev} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.nev}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {t.osztalyok.map((o) => <Pill key={o} tone="blue">{SHORT[o] ?? o}</Pill>)}
                    </div>
                  </div>
                  {t.szolgalatban && <Pill tone="green">Szolgálatban</Pill>}
                  {t.szabadsagon && <Pill tone="orange">Szabadságon</Pill>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
