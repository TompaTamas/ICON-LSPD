import { useEffect, useState } from 'react';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { Empty, ErrorNote, Field, Loading, Modal, PageHeader, Pill, Tabs } from '../components/ui.jsx';
import { LoaDecisions } from './Leave.jsx';

const WEEKDAYS = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'];
const APPT_STATUS = { fuggoben: ['Függőben', 'orange'], elfogadva: ['Elfogadva', 'green'], elutasitva: ['Elutasítva', 'red'], javaslat: ['Javaslat elküldve', 'blue'], lemondva: ['Lemondva', 'gray'] };
const lines = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

function useAction(reload) {
  const [error, setError] = useState(null);
  const run = async (fn) => {
    setError(null);
    try {
      await fn();
      await reload?.();
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  };
  return [error, run];
}

// ───────────── Időpontok ─────────────

function AppointmentsAdmin() {
  const [status, setStatus] = useState('fuggoben');
  const { data, loading, reload } = useApi(`/api/idopontok${status ? `?allapot=${status}` : ''}`);
  const [error, run] = useAction(reload);
  const [propose, setPropose] = useState(null);
  const [when, setWhen] = useState('');

  const decide = (a, body) => run(() => api(`/api/idopontok/${a.id}/dontes`, { method: 'POST', body }));
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {[['fuggoben', 'Függőben'], ['elfogadva', 'Elfogadva'], ['javaslat', 'Javaslat'], ['', 'Mind']].map(([v, l]) => (
          <button key={v} type="button" className={`btn btn-sm ${status === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>
      <ErrorNote error={error} />
      {loading && <Loading />}
      {data && data.length === 0 && <Empty title="Nincs ilyen foglalás" />}
      <ul className="space-y-2">
        {(data ?? []).map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-sheet px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{a.type?.name} – {a.foglalo}</p>
              <p className="text-sm text-steel">{formatDateTime(a.starts_at)}{a.note ? ` · „${a.note}”` : ''}</p>
              {a.donto && <p className="text-xs text-mute">Döntött: {a.donto}{a.decision_note ? ` – ${a.decision_note}` : ''}</p>}
            </div>
            <Pill tone={APPT_STATUS[a.status][1]}>{APPT_STATUS[a.status][0]}</Pill>
            {a.status === 'fuggoben' && <button type="button" className="btn btn-primary btn-sm" onClick={() => decide(a, { dontes: 'elfogad' })}>Elfogad</button>}
            {['fuggoben', 'javaslat'].includes(a.status) && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPropose(a); setWhen(''); }}>Új időpont</button>}
            {['fuggoben', 'elfogadva', 'javaslat'].includes(a.status) && (
              <button type="button" className="btn btn-ghost btn-sm text-siren-red" onClick={() => { const m = prompt('Az elutasítás indoka:'); if (m) decide(a, { dontes: 'elutasit', megjegyzes: m }); }}>Elutasít</button>
            )}
          </li>
        ))}
      </ul>
      <Modal open={!!propose} title="Új időpont javaslata" onClose={() => setPropose(null)}>
        <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (await decide(propose, { dontes: 'javasol', javasolt: new Date(when).toISOString() })) setPropose(null); }}>
          <Field label="Javasolt időpont"><input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} required /></Field>
          <p className="text-sm text-steel">A foglaló DM-et kap, és a weboldalon vagy a Discordon elfogadhatja.</p>
          <button type="submit" className="btn btn-primary">Javaslat elküldése</button>
        </form>
      </Modal>
    </>
  );
}

// ───────────── Időpont-típusok ─────────────

function TypeEditor({ value, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [error, run] = useAction(null);
  useEffect(() => {
    if (value) setForm({ name: value.name ?? '', description: value.description ?? '', ic_info: value.ic_info ?? '', slot_minutes: value.slot_minutes ?? 30, ping_roles: (value.ping_roles ?? []).join('\n'), active: value.active ?? true, savok: value.savok ?? [] });
  }, [value]);
  if (!value || !form) return <Modal open={false} onClose={onClose} />;
  const save = async (e) => {
    e.preventDefault();
    const ok = await run(async () => {
      const body = { name: form.name, description: form.description, ic_info: form.ic_info, slot_minutes: Number(form.slot_minutes), ping_roles: lines(form.ping_roles), active: form.active };
      const saved = await api(value.id ? `/api/admin/idopont-tipusok/${value.id}` : '/api/admin/idopont-tipusok', { method: value.id ? 'PUT' : 'POST', body });
      await api(`/api/admin/idopont-tipusok/${saved.id}/savok`, { method: 'PUT', body: { savok: form.savok.map((s) => ({ ...s, weekday: Number(s.weekday) })) } });
    });
    if (ok) onSaved();
  };
  const setSav = (i, key, v) => setForm({ ...form, savok: form.savok.map((s, j) => (j === i ? { ...s, [key]: v } : s)) });
  return (
    <Modal open wide title={value.id ? 'Időpont-típus szerkesztése' : 'Új időpont-típus'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field label="Név"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Sávhossz (perc)"><input type="number" min="10" max="240" className="input num" value={form.slot_minutes} onChange={(e) => setForm({ ...form, slot_minutes: e.target.value })} /></Field>
        </div>
        <Field label="Leírás" hint="A foglalási oldalon jelenik meg."><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Teendő elfogadás után (IC helyszín, mit hozzon)" hint="A bot ezt küldi el privát üzenetben, amikor a vezetőség elfogadja az időpontot.">
          <textarea className="input min-h-20" value={form.ic_info} onChange={(e) => setForm({ ...form, ic_info: e.target.value })} maxLength={800} />
        </Field>
        <Field label="Pingelt Discord-rangok" hint="Soronként egy rangnév, pontosan úgy, ahogy a Discordon szerepel."><textarea className="input min-h-24" value={form.ping_roles} onChange={(e) => setForm({ ...form, ping_roles: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Foglalható</label>
        <fieldset>
          <legend className="label">Fogadási idősávok (minden héten ismétlődik)</legend>
          <div className="space-y-2">
            {form.savok.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select className="input w-40" value={s.weekday} onChange={(e) => setSav(i, 'weekday', e.target.value)} aria-label="Nap">
                  {WEEKDAYS.map((d, k) => <option key={d} value={k + 1}>{d}</option>)}
                </select>
                <input type="time" className="input w-32" value={s.start_time} onChange={(e) => setSav(i, 'start_time', e.target.value)} aria-label="Kezdés" />
                <span>–</span>
                <input type="time" className="input w-32" value={s.end_time} onChange={(e) => setSav(i, 'end_time', e.target.value)} aria-label="Vége" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, savok: form.savok.filter((_, j) => j !== i) })}>Törlés</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setForm({ ...form, savok: [...form.savok, { weekday: 1, start_time: '18:00', end_time: '20:00' }] })}>+ Idősáv</button>
        </fieldset>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Mégse</button><button type="submit" className="btn btn-primary">Mentés</button></div>
      </form>
    </Modal>
  );
}

function TypesAdmin() {
  const types = useApi('/api/admin/idopont-tipusok');
  const exceptions = useApi('/api/admin/kivetelnapok');
  const [edit, setEdit] = useState(null);
  const [exc, setExc] = useState({ date: '', reason: '', type_id: '' });
  const [error, run] = useAction(exceptions.reload);
  if (types.loading) return <Loading />;
  return (
    <>
      <div className="mb-4 flex justify-end"><button type="button" className="btn btn-primary" onClick={() => setEdit({})}>Új típus</button></div>
      <ul className="space-y-2">
        {(types.data ?? []).map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-sheet px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.name} {!t.active && <Pill>Szünetel</Pill>}</p>
              <p className="text-sm text-steel">{t.slot_minutes} perc · {t.savok.map((s) => `${WEEKDAYS[s.weekday - 1]} ${s.start_time}–${s.end_time}`).join(', ') || 'nincs idősáv'}</p>
              <p className="text-xs text-mute">Pingel: {t.ping_roles.join(', ') || '—'}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(t)}>Szerkesztés</button>
          </li>
        ))}
      </ul>
      <h3 className="display mt-10 mb-3 text-2xl font-bold">Kivételnapok</h3>
      <p className="mb-4 text-sm text-steel">Ezeken a napokon nem lehet időpontot foglalni (pl. ünnep, szerverkarbantartás).</p>
      <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/admin/kivetelnapok', { method: 'POST', body: { date: exc.date, reason: exc.reason, type_id: exc.type_id ? Number(exc.type_id) : null } })).then((ok) => ok && setExc({ date: '', reason: '', type_id: '' })); }}>
        <Field label="Dátum"><input type="date" className="input" value={exc.date} onChange={(e) => setExc({ ...exc, date: e.target.value })} required /></Field>
        <Field label="Típus">
          <select className="input" value={exc.type_id} onChange={(e) => setExc({ ...exc, type_id: e.target.value })}>
            <option value="">Mindegyik</option>
            {(types.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Ok"><input className="input" value={exc.reason} onChange={(e) => setExc({ ...exc, reason: e.target.value })} /></Field>
        <button type="submit" className="btn btn-primary">Hozzáadás</button>
      </form>
      <ErrorNote error={error} />
      <ul className="divide-y divide-line">
        {(exceptions.data ?? []).map((x) => (
          <li key={x.id} className="flex items-center justify-between py-2 text-sm">
            <span><strong className="num">{x.date}</strong> · {(types.data ?? []).find((t) => t.id === x.type_id)?.name ?? 'minden típus'}{x.reason ? ` · ${x.reason}` : ''}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => run(() => api(`/api/admin/kivetelnapok/${x.id}`, { method: 'DELETE' }))}>Törlés</button>
          </li>
        ))}
      </ul>
      <TypeEditor value={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); types.reload(); }} />
    </>
  );
}

// ───────────── Beállítások ─────────────

const GROUP_LABELS = {
  vezetok: ['Vezetők', 'Szerkeszthetik a BTK-t, a Szabályzatot és a közleményeket, és elérik ezt a felületet.'],
  felugyelok: ['Felügyelők', 'Kezelik a ticketeket, a szabadságkérelmeket és a szolgálati korrekciókat.'],
  rendfokozatok: ['Rendfokozatok (sorrendben)', 'Aki ezek közül bármelyiket viseli, LSPD-tagnak számít. Az Állomány oldal ebben a sorrendben listáz.'],
  osztalyok: ['Osztályok', 'Az Állomány oldalon jelvényként jelennek meg.'],
};

function SettingsAdmin() {
  const { data, loading, reload } = useApi('/api/beallitasok');
  const [form, setForm] = useState(null);
  const [error, run] = useAction(reload);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (data) {
      setForm({
        groups: Object.fromEntries(Object.keys(GROUP_LABELS).map((k) => [k, (data.roleGroups[k] ?? []).join('\n')])),
        channels: { ...data.channels },
        awards: { ...data.awardsMinHours },
        autoRole: data.autoRole ?? '',
        tickets: data.ticketCategories.map((c) => ({ ...c, roles: c.roles.join('\n') })),
      });
    }
  }, [data]);
  if (loading || !form) return <Loading />;

  const save = async (e) => {
    e.preventDefault();
    setSaved(false);
    const ok = await run(() => api('/api/beallitasok', {
      method: 'PUT',
      body: {
        roleGroups: Object.fromEntries(Object.entries(form.groups).map(([k, v]) => [k, lines(v)])),
        channels: form.channels,
        awardsMinHours: Object.fromEntries(Object.entries(form.awards).map(([k, v]) => [k, Number(v)])),
        autoRole: form.autoRole,
        ticketCategories: form.tickets.map((c) => ({ ...c, roles: lines(c.roles) })),
      },
    }));
    setSaved(ok);
  };
  const setTicket = (i, k, v) => setForm({ ...form, tickets: form.tickets.map((c, j) => (j === i ? { ...c, [k]: v } : c)) });

  return (
    <form onSubmit={save} className="space-y-12">
      <section>
        <h3 className="display mb-1 text-2xl font-bold">Rangcsoportok</h3>
        <p className="mb-4 text-sm text-steel">Soronként egy Discord-rangnév, pontosan úgy, ahogy a szerveren szerepel.</p>
        <div className="grid gap-5 md:grid-cols-2">
          {Object.entries(GROUP_LABELS).map(([k, [label, hint]]) => (
            <Field key={k} label={label} hint={hint}><textarea className="input min-h-36 text-sm" value={form.groups[k]} onChange={(e) => setForm({ ...form, groups: { ...form.groups, [k]: e.target.value } })} /></Field>
          ))}
        </div>
      </section>

      <section>
        <h3 className="display mb-1 text-2xl font-bold">Csatornák</h3>
        <p className="mb-4 text-sm text-steel">Discord-csatorna azonosítók. A <code>/beallitas csatornak</code> parancs automatikusan kitölti; itt csak javítani kell, ha valami rossz helyre kerül.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(data.csatornaKulcsok).map(([k, label]) => (
            <Field key={k} label={label}><input className="input num" value={form.channels[k] ?? ''} onChange={(e) => setForm({ ...form, channels: { ...form.channels, [k]: e.target.value.trim() } })} placeholder="csatorna ID" /></Field>
          ))}
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="display mb-1 text-2xl font-bold">Díjak minimuma</h3>
          <p className="mb-4 text-sm text-steel">Ennyi szolgálati óra kell ahhoz, hogy valaki megkaphassa a díjat.</p>
          <div className="grid grid-cols-3 gap-3">
            {[['het', 'Heti'], ['honap', 'Havi'], ['ev', 'Éves']].map(([k, l]) => (
              <Field key={k} label={`${l} (óra)`}><input type="number" min="0" className="input num" value={form.awards[k]} onChange={(e) => setForm({ ...form, awards: { ...form.awards, [k]: e.target.value } })} /></Field>
            ))}
          </div>
        </div>
        <div>
          <h3 className="display mb-1 text-2xl font-bold">Automatikus rang</h3>
          <p className="mb-4 text-sm text-steel">Aki belép a Discord szerverre, ezt a rangot kapja. Hagyd üresen, ha nem kell.</p>
          <Field label="Rang neve"><input className="input" value={form.autoRole} onChange={(e) => setForm({ ...form, autoRole: e.target.value })} /></Field>
        </div>
      </section>

      <section>
        <h3 className="display mb-1 text-2xl font-bold">Ticket-kategóriák</h3>
        <p className="mb-4 text-sm text-steel">A változás után futtasd a <code>/beallitas panelek</code> parancsot, hogy a Discordon is frissüljön a panel.</p>
        <div className="space-y-3">
          {form.tickets.map((c, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-line bg-sheet p-4 md:grid-cols-[4rem_1fr_1.5fr_1.2fr_auto]">
              <Field label="Emoji"><input className="input" value={c.emoji} onChange={(e) => setTicket(i, 'emoji', e.target.value)} /></Field>
              <Field label="Név"><input className="input" value={c.label} onChange={(e) => setTicket(i, 'label', e.target.value)} /></Field>
              <Field label="Leírás"><input className="input" value={c.description} onChange={(e) => setTicket(i, 'description', e.target.value)} /></Field>
              <Field label="Kezelő rangok (soronként)"><textarea className="input min-h-20 text-sm" value={c.roles} onChange={(e) => setTicket(i, 'roles', e.target.value)} /></Field>
              <button type="button" className="btn btn-ghost btn-sm self-end" onClick={() => setForm({ ...form, tickets: form.tickets.filter((_, j) => j !== i) })}>Törlés</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={() => setForm({ ...form, tickets: [...form.tickets, { key: `kat-${Date.now().toString(36).slice(-5)}`, label: 'Új kategória', emoji: '📁', description: '', roles: 'LSPD | High Command' }] })}>+ Kategória</button>
      </section>

      <div className="sticky bottom-4 flex items-center gap-3 rounded-lg border border-line bg-sheet p-3 shadow-lg">
        <button type="submit" className="btn btn-primary">Beállítások mentése</button>
        {saved && <span className="text-sm text-ok">Elmentve.</span>}
        <ErrorNote error={error} />
      </div>
    </form>
  );
}

// ───────────── Változásnapló ─────────────

const ENTITY = { btk_item: 'BTK-tétel', btk_chapter: 'BTK-fejezet', btk: 'BTK sorrend', rules_section: 'Szabályzat', rules: 'Szabályzat sorrend', announcement: 'Közlemény', settings: 'Beállítások' };
const ACTION = { letrehozas: 'létrehozta', modositas: 'módosította', torles: 'törölte', sorrend: 'átrendezte' };

function changedKeys(before, after) {
  if (!before || !after || typeof before !== 'object') return [];
  return Object.keys({ ...before, ...after }).filter((k) => !['updated_at', 'updated_by'].includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}

function ChangeLog() {
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(`/api/valtozasnaplo?oldal=${page}&meret=30`);
  if (loading) return <Loading />;
  const pages = Math.max(1, Math.ceil(data.total / 30));
  return (
    <>
      {data.items.length === 0 && <Empty title="Még nincs szerkesztés" />}
      <ul className="divide-y divide-line">
        {data.items.map((r) => {
          const keys = changedKeys(r.before, r.after);
          const name = (r.after ?? r.before)?.title ?? (r.after ?? r.before)?.paragraph ?? '';
          return (
            <li key={r.id} className="py-3 text-sm">
              <p><strong>{r.szerkeszto ?? 'Ismeretlen'}</strong> {ACTION[r.action] ?? r.action}: {ENTITY[r.entity] ?? r.entity}{name ? ` – ${name}` : ''}</p>
              <p className="text-xs text-mute">{formatDateTime(r.created_at)}{keys.length ? ` · változott: ${keys.join(', ')}` : ''}</p>
            </li>
          );
        })}
      </ul>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Előző</button>
          <span className="num">{page} / {pages}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Következő</button>
        </div>
      )}
    </>
  );
}

const TABS = [
  { value: 'idopontok', label: 'Időpontok', el: <AppointmentsAdmin /> },
  { value: 'tipusok', label: 'Időpont-típusok', el: <TypesAdmin /> },
  { value: 'szabadsagok', label: 'Szabadságok', el: <LoaDecisions /> },
  { value: 'beallitasok', label: 'Beállítások', el: <SettingsAdmin /> },
  { value: 'naplo', label: 'Változásnapló', el: <ChangeLog /> },
];

export default function Admin() {
  const [tab, setTab] = useState('idopontok');
  return (
    <>
      <PageHeader title="Vezetői felület" intro="Időpontok, szabadságok és a bot beállításai. Minden módosítás bekerül a változásnaplóba." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {TABS.find((t) => t.value === tab).el}
    </>
  );
}
