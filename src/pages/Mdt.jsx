import { useEffect, useState } from 'react';
import { useApi } from '../lib/useApi.js';
import { formatDateTime } from '../lib/format.js';
import { Empty, ErrorNote, Loading, Modal, PageHeader, Pill, Tabs } from '../components/ui.jsx';

const CLOSED_TONE = { teljesult: 'green', lezart: 'gray', kiadva: 'green', visszavont: 'gray', megsemmisitve: 'gray' };
const OPEN_TONE = { aktiv: 'red', nyitott: 'blue', rogzitett: 'blue' };

function Detail({ entry, types, onClose }) {
  if (!entry) return <Modal open={false} onClose={onClose} />;
  const def = types[entry.type];
  const images = [entry.data.kep, ...(entry.data.kepek ?? [])].filter(Boolean);
  return (
    <Modal open wide title={`${def.label}: ${entry.title}`} onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-steel">
        <Pill tone={OPEN_TONE[entry.status] ?? CLOSED_TONE[entry.status] ?? 'gray'}>{def.allapotok[entry.status]}</Pill>
        <span className="num">{entry.external_id}</span>
        <span>· {formatDateTime(entry.created_at)}</span>
        {entry.author_name && <span>· {entry.author_name}</span>}
      </div>
      {entry.data.leiras && <p className="mb-5 whitespace-pre-line">{entry.data.leiras}</p>}
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {def.mezok.filter(([k]) => !['leiras', 'kep', 'kepek'].includes(k) && entry.data[k]).map(([k, label]) => (
          <div key={k}>
            <dt className="text-sm text-steel">{label}</dt>
            <dd className="font-semibold">{entry.data[k]}</dd>
          </div>
        ))}
      </dl>
      {images.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {images.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" className="w-full rounded-md border border-line" loading="lazy" /></a>)}
        </div>
      )}
    </Modal>
  );
}

export default function Mdt() {
  const types = useApi('/api/mdt-tipusok');
  const summary = useApi('/api/mdt/osszesito', { refreshMs: 60_000 });
  const [type, setType] = useState('korozes');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(query); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const params = new URLSearchParams({ tipus: type, oldal: String(page), meret: '20' });
  if (status) params.set('allapot', status);
  if (debounced) params.set('q', debounced);
  const list = useApi(`/api/mdt?${params}`, { refreshMs: 60_000 });

  if (types.loading) return <Loading />;
  if (types.error) return <ErrorNote error={types.error} />;
  const defs = types.data;
  const def = defs[type];
  const total = (t) => Object.values(summary.data?.[t] ?? {}).reduce((a, b) => a + b, 0);
  const pages = Math.max(1, Math.ceil((list.data?.total ?? 0) / 20));

  return (
    <>
      <PageHeader title="MDT" intro="A FiveM MDT-ből érkező jelentések, körözések, BOLO-k és bizonyítékok. Az adatok percenként frissülnek." />
      <Tabs
        value={type}
        onChange={(t) => { setType(t); setStatus(''); setPage(1); }}
        tabs={Object.entries(defs).map(([k, d]) => ({ value: k, label: d.label, count: summary.data ? total(k) : null }))}
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <input type="search" className="input max-w-sm" placeholder="Név, rendszám, azonosító…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Keresés" />
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Állapot">
          <option value="">Minden állapot</option>
          {Object.entries(def.allapotok).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {list.loading && <Loading />}
      <ErrorNote error={list.error} />
      {list.data && list.data.items.length === 0 && <Empty title={`Nincs ${def.label.toLowerCase()}`}>Ha a FiveM MDT-ben rögzítenek egyet, itt és a Discordon is megjelenik.</Empty>}
      {list.data && list.data.items.length > 0 && (
        <div className="sheet overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-steel">
              <tr>
                <th className="px-4 py-3 font-semibold">Azonosító</th>
                <th className="px-4 py-3 font-semibold">Megnevezés</th>
                <th className="px-4 py-3 font-semibold">Állapot</th>
                <th className="px-4 py-3 font-semibold">Rögzítette</th>
                <th className="px-4 py-3 font-semibold">Időpont</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.data.items.map((e) => (
                <tr key={e.id} className="cursor-pointer hover:bg-paper" onClick={() => setOpen(e)}>
                  <td className="px-4 py-3 font-semibold num">{e.external_id}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-left font-semibold hover:underline" onClick={(ev) => { ev.stopPropagation(); setOpen(e); }}>{e.title}</button>
                    {e.type === 'korozes' && e.data.veszelyesseg === 'magas' && e.status === 'aktiv' && <Pill tone="red" className="ml-2">Veszélyes</Pill>}
                  </td>
                  <td className="px-4 py-3"><Pill tone={OPEN_TONE[e.status] ?? CLOSED_TONE[e.status] ?? 'gray'}>{def.allapotok[e.status]}</Pill></td>
                  <td className="px-4 py-3 text-steel">{e.author_name ?? '—'}</td>
                  <td className="px-4 py-3 text-steel num">{formatDateTime(e.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Előző</button>
          <span className="num">{page} / {pages}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Következő</button>
        </div>
      )}
      <Detail entry={open} types={defs} onClose={() => setOpen(null)} />
    </>
  );
}
