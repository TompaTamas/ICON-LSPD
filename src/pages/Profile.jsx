import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { MONTHS, formatDateTime, formatDuration } from '../lib/format.js';
import { Avatar, ErrorNote, Field, Loading, PageHeader, Pill } from '../components/ui.jsx';
import { DayBars } from '../components/charts.jsx';

function BirthdayForm() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ honap: '', nap: '', ev: '' });
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const b = user.szuletesnap;
    setForm({ honap: b?.honap ?? '', nap: b?.nap ?? '', ev: b?.ev ?? '' });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api('/api/me/szuletesnap', { method: 'PUT', body: { honap: Number(form.honap), nap: Number(form.nap), ev: form.ev ? Number(form.ev) : null } });
      setMsg('Elmentve. A születésnapodon reggel 9-kor felköszöntünk a Discordon!');
      refresh();
    } catch (err) {
      setError(err);
    }
  };
  const remove = async () => {
    await api('/api/me/szuletesnap', { method: 'DELETE' });
    setMsg('Töröltük a születésnapodat.');
    refresh();
  };

  return (
    <form onSubmit={save} className="sheet space-y-4 p-6">
      <h2 className="display text-2xl font-bold">Születésnap</h2>
      <p className="text-sm text-steel">Ha megadod, a születésnapodon a bot felköszönt a Discordon. Ha kilépsz a szerverről, automatikusan törlődik.</p>
      <div className="grid grid-cols-[1fr_5rem_6rem] gap-3">
        <Field label="Hónap">
          <select className="input" value={form.honap} onChange={(e) => setForm({ ...form, honap: e.target.value })} required>
            <option value="">–</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Nap"><input type="number" className="input num" min="1" max="31" value={form.nap} onChange={(e) => setForm({ ...form, nap: e.target.value })} required /></Field>
        <Field label="Év" hint="Nem kötelező"><input type="number" className="input num" min="1900" max={new Date().getFullYear()} value={form.ev} onChange={(e) => setForm({ ...form, ev: e.target.value })} /></Field>
      </div>
      <ErrorNote error={error} />
      {msg && <p className="text-sm text-ok">{msg}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">Mentés</button>
        {user.szuletesnap && <button type="button" className="btn btn-ghost" onClick={remove}>Törlés</button>}
      </div>
    </form>
  );
}

function DutyStats() {
  const { data, loading, error } = useApi('/api/szolgalat/sajat', { refreshMs: 60_000 });
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  const { het, honap, ev, legutobbi } = data;
  return (
    <section className="sheet p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display text-2xl font-bold">Szolgálati időm a héten</h2>
        {het.open && <Pill tone="green">Most szolgálatban</Pill>}
      </div>
      <p className="mb-6 text-sm text-steel">{het.label}</p>
      <DayBars days={het.daily} />
      <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-5">
        {[['Ezen a héten', het], ['Ebben a hónapban', honap], ['Az idén', ev]].map(([label, s]) => (
          <div key={label}>
            <dt className="text-sm text-steel">{label}</dt>
            <dd className="display text-3xl font-bold num">{formatDuration(s.seconds)}</dd>
            <dd className="text-xs text-mute num">{s.sessions} szolgálat</dd>
          </div>
        ))}
      </dl>
      {legutobbi.length > 0 && (
        <>
          <h3 className="mt-8 mb-2 font-semibold">Legutóbbi szolgálataim</h3>
          <ul className="divide-y divide-line text-sm">
            {legutobbi.map((s) => (
              <li key={s.id} className="flex justify-between gap-3 py-2">
                <span>{formatDateTime(s.started_at)}{s.callsign ? ` · ${s.callsign}` : ''}</span>
                <span className="text-steel num">{s.ended_at ? formatDuration((Date.parse(s.ended_at) - Date.parse(s.started_at)) / 1000) : 'folyamatban'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export default function Profile() {
  const { user, can } = useAuth();
  return (
    <>
      <PageHeader title="Profilom" />
      <div className="mb-10 flex items-center gap-5">
        <Avatar src={user.avatar} name={user.nev} size={72} />
        <div>
          <p className="display text-4xl font-bold">{user.nev}</p>
          <p className="text-steel">@{user.felhasznalonev}{user.rendfokozat ? ` · ${user.rendfokozat}` : ''}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.rangok.slice(0, 12).map((r) => <Pill key={r}>{r}</Pill>)}
          </div>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {can('lspd') ? <DutyStats /> : <p className="text-steel">A szolgálati statisztika az LSPD-tagoknak jelenik meg.</p>}
        <BirthdayForm />
      </div>
    </>
  );
}
