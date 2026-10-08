import { useMemo, useState } from 'react';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { dayKey, formatDateTime, formatShortDate, formatTime } from '../lib/format.js';
import { Empty, ErrorNote, Field, Loading, PageHeader, Pill } from '../components/ui.jsx';

const STATUS = {
  fuggoben: ['Függőben', 'orange'],
  elfogadva: ['Elfogadva', 'green'],
  elutasitva: ['Elutasítva', 'red'],
  javaslat: ['Új időpontot javasoltak', 'blue'],
  lemondva: ['Lemondva', 'gray'],
};
const DAY_MS = 86_400_000;

function SlotPicker({ type, onPicked }) {
  const [page, setPage] = useState(0);
  // Az időablakot oldalanként egyszer számoljuk (különben minden rajzolás új kérést indítana).
  const [from, to] = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const f = new Date(start.getTime() + page * 14 * DAY_MS);
    return [f, new Date(f.getTime() + 13 * DAY_MS + DAY_MS - 1)];
  }, [page]);
  const { data, loading, error } = useApi(`/api/idopontok/szabad?tipus=${type.id}&tol=${from.toISOString()}&ig=${to.toISOString()}`);
  const byDay = useMemo(() => {
    const map = new Map();
    for (const s of data ?? []) {
      const key = dayKey(s.startsAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Előző két hét</button>
        <span className="text-sm text-steel">{formatShortDate(from)} – {formatShortDate(to)}</span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={page >= 1} onClick={() => setPage(page + 1)}>Következő két hét</button>
      </div>
      {loading && <Loading text="Szabad időpontok keresése…" />}
      <ErrorNote error={error} />
      {data && byDay.length === 0 && <Empty title="Ebben az időszakban nincs szabad időpont">Nézd meg a következő két hetet, vagy nyiss ticketet a Discordon.</Empty>}
      <div className="space-y-4">
        {byDay.map(([day, slots]) => (
          <div key={day} className="grid gap-3 border-b border-line pb-4 sm:grid-cols-[9rem_1fr]">
            <p className="font-semibold capitalize">{formatShortDate(slots[0].startsAt)}</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button key={s.startsAt} type="button" className="btn btn-ghost btn-sm num" onClick={() => onPicked(s)}>{formatTime(s.startsAt)}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Booking({ onBooked }) {
  const types = useApi('/api/idopontok/tipusok');
  const [type, setType] = useState(null);
  const [slot, setSlot] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const booked = await api('/api/idopontok', { method: 'POST', body: { tipus: type.id, kezdes: slot.startsAt, megjegyzes: note } });
      setType(null);
      setSlot(null);
      setNote('');
      onBooked(booked);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (types.loading) return <Loading />;
  if (!type) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {(types.data ?? []).map((t) => (
          <button key={t.id} type="button" onClick={() => setType(t)} className="rounded-lg border border-line bg-sheet p-5 text-left hover:border-uniform">
            <span className="display block text-2xl font-bold">{t.name}</span>
            <span className="mt-1 block text-steel">{t.description}</span>
            <span className="mt-3 block text-sm font-semibold text-uniform">{t.slot_minutes} perc</span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="sheet p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="display text-3xl font-bold">{type.name}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setType(null); setSlot(null); }}>Másik típus</button>
      </div>
      {!slot ? (
        <SlotPicker type={type} onPicked={setSlot} />
      ) : (
        <form onSubmit={submit} className="max-w-xl space-y-4">
          <p className="text-lg">Kiválasztott időpont: <strong>{formatDateTime(slot.startsAt)}</strong> ({type.slot_minutes} perc)</p>
          <Field label="Megjegyzés a vezetőségnek" hint="Pl. az IC neved, miről szeretnél beszélni, vagy melyik vizsgára jössz.">
            <textarea className="input min-h-24" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </Field>
          <ErrorNote error={error} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Foglalás…' : 'Időpont lefoglalása'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setSlot(null)}>Másik időpont</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Appointments() {
  const mine = useApi('/api/idopontok/sajat');
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const act = async (path) => {
    setError(null);
    try {
      await api(path, { method: 'POST' });
      mine.reload();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <>
      <PageHeader
        title="Időpontfoglalás"
        intro="Csatlakozni csak IC lehet: foglalj felvételi interjút egy olyan időpontra, ami a vezetőségnek is megfelel. Az időpont akkor érvényes, ha a vezetőség elfogadja – erről a bot privát üzenetet küld a Discordon. Egyszerre legfeljebb két nyitott foglalásod lehet."
      />
      {done?.dm === true && (
        <p className="mb-6 rounded-md bg-ok/10 px-4 py-3 text-ok">Elküldtük a foglalásodat, a bot DM-ben vissza is igazolta. Amint a vezetőség dönt, újabb privát üzenetet kapsz.</p>
      )}
      {done?.dm === false && (
        <div className="mb-6 rounded-md border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-ink" role="alert">
          <p className="font-semibold">A foglalásod megérkezett, de a bot nem tudott privát üzenetet küldeni neked.</p>
          <p className="mt-1">Így nem fogod megkapni a vezetőség döntését. Discordon kattints jobb gombbal az ICON LSPD szerverre → <strong>Adatvédelmi beállítások</strong> → kapcsold be a <strong>Közvetlen üzenetek</strong> lehetőséget. A döntést addig is itt, a Foglalásaim alatt látod.</p>
        </div>
      )}
      <Booking onBooked={(booked) => { setDone(booked); mine.reload(); }} />

      <h2 className="display mt-14 mb-4 text-3xl font-bold">Foglalásaim</h2>
      <ErrorNote error={error} />
      {mine.loading && <Loading />}
      {mine.data && mine.data.length === 0 && <Empty title="Még nincs foglalásod" />}
      <ul className="space-y-3">
        {(mine.data ?? []).map((a) => {
          const [label, tone] = STATUS[a.status];
          const future = Date.parse(a.starts_at) > Date.now();
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-sheet px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.type?.name}</p>
                <p className="text-sm text-steel">{formatDateTime(a.starts_at)}{a.decision_note ? ` · ${a.decision_note}` : ''}</p>
                {a.status === 'javaslat' && <p className="mt-1 text-sm">Javasolt új időpont: <strong>{formatDateTime(a.proposed_starts_at)}</strong></p>}
                {a.status === 'elfogadva' && a.type?.ic_info && <p className="mt-2 border-l-2 border-ok pl-3 text-sm">{a.type.ic_info}</p>}
              </div>
              <Pill tone={tone}>{label}</Pill>
              {a.status === 'javaslat' && <button type="button" className="btn btn-primary btn-sm" onClick={() => act(`/api/idopontok/${a.id}/javaslat-elfogad`)}>Új időpont elfogadása</button>}
              {['fuggoben', 'elfogadva', 'javaslat'].includes(a.status) && future && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => confirm('Biztosan lemondod?') && act(`/api/idopontok/${a.id}/lemond`)}>Lemondás</button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
