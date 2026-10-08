import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { Empty, ErrorNote, Field, Loading, PageHeader, Pill } from '../components/ui.jsx';

export const LOA_STATUS = { fuggoben: ['Függőben', 'orange'], elfogadva: ['Elfogadva', 'green'], elutasitva: ['Elutasítva', 'red'], lejart: ['Lejárt', 'gray'] };

export function LoaDecisions() {
  const { data, loading, error, reload } = useApi('/api/szabadsagok');
  const [actionError, setActionError] = useState(null);
  const decide = async (r, dontes) => {
    const megjegyzes = dontes === 'elutasit' ? prompt('Az elutasítás indoka (a kérelmező is látja):') : null;
    if (dontes === 'elutasit' && !megjegyzes) return;
    setActionError(null);
    try {
      await api(`/api/szabadsagok/${r.id}/dontes`, { method: 'POST', body: { dontes, megjegyzes } });
      reload();
    } catch (err) {
      setActionError(err);
    }
  };
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!data.length) return <Empty title="Nincs szabadságkérelem" />;
  return (
    <>
      <ErrorNote error={actionError} />
      <ul className="space-y-2">
        {data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-sheet px-5 py-3">
            <span className="font-semibold">{r.nev}</span>
            <span className="num">{r.starts_on} – {r.ends_on}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-steel" title={r.reason}>{r.reason}</span>
            <Pill tone={LOA_STATUS[r.status][1]}>{LOA_STATUS[r.status][0]}</Pill>
            {r.status === 'fuggoben' && (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => decide(r, 'elfogad')}>Elfogad</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => decide(r, 'elutasit')}>Elutasít</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Leave() {
  const { can } = useAuth();
  const mine = useApi('/api/szabadsag/sajat');
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ startsOn: today, endsOn: today, reason: '' });
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api('/api/szabadsag', { method: 'POST', body: form });
      setSent(true);
      setForm({ ...form, reason: '' });
      mine.reload();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <>
      <PageHeader title="Szabadság" intro="Ha egy ideig nem tudsz szolgálatba lépni, kérj szabadságot. Elfogadás után a szabadság idejére megkapod a Leave Of Absence rangot, a végén a bot automatikusan leveszi." />
      <div className="grid gap-12 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-4">
          <h2 className="display text-3xl font-bold">Új kérelem</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Első nap"><input type="date" className="input" min={today} value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} required /></Field>
            <Field label="Utolsó nap"><input type="date" className="input" min={form.startsOn} value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} required /></Field>
          </div>
          <Field label="Indok" hint="Legfeljebb 60 nap kérhető egyszerre."><textarea className="input min-h-28" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required minLength={5} maxLength={500} /></Field>
          <ErrorNote error={error} />
          {sent && <p className="text-sm text-ok">Elküldve. A döntésről DM-et kapsz a Discordon.</p>}
          <button type="submit" className="btn btn-primary">Kérelem elküldése</button>
        </form>
        <div>
          <h2 className="display mb-4 text-3xl font-bold">Kérelmeim</h2>
          {mine.loading && <Loading />}
          {mine.data && mine.data.length === 0 && <Empty title="Még nem kértél szabadságot" />}
          <ul className="space-y-2">
            {(mine.data ?? []).map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-sheet px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold num">{r.starts_on} – {r.ends_on}</span>
                  <Pill tone={LOA_STATUS[r.status][1]}>{LOA_STATUS[r.status][0]}</Pill>
                </div>
                <p className="mt-1 text-sm text-steel">{r.reason}</p>
                <p className="mt-1 text-xs text-mute">Beküldve: {formatDateTime(r.created_at)}{r.decision_note ? ` · ${r.decision_note}` : ''}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {can('felugyelo') && (
        <section className="mt-14">
          <h2 className="display mb-4 text-3xl font-bold">Kérelmek elbírálása</h2>
          <LoaDecisions />
        </section>
      )}
    </>
  );
}
