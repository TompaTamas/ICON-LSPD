import { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { formatMoneyRange, formatRange } from '../lib/format.js';
import { calculate, summaryText } from '../lib/btkCalc.js';
import { ErrorNote, Loading, Markdown, Modal, PageHeader, Pill } from '../components/ui.jsx';
import { ChapterEditor, ItemEditor } from './btk/Editors.jsx';
import BTK_FALLBACK from '../data/btk-alap.json';

const CATEGORY_TONE = { szabalysertes: 'gray', vetseg: 'orange', buntett: 'red' };

function Counter({ count, onChange, title }) {
  if (!count) {
    return (
      <button type="button" className="btn btn-ghost btn-sm w-24" onClick={() => onChange(1)} aria-label={`${title} hozzáadása a cédulához`}>
        + Cédulára
      </button>
    );
  }
  return (
    <div className="flex w-24 items-center justify-between rounded-md border border-uniform bg-uniform/5" role="group" aria-label={`${title} darabszám`}>
      <button type="button" className="px-2.5 py-1 font-bold text-uniform" onClick={() => onChange(count - 1)} aria-label="Kevesebb">−</button>
      <span className="font-semibold num">{count}×</span>
      <button type="button" className="px-2.5 py-1 font-bold text-uniform" onClick={() => onChange(count + 1)} aria-label="Több">+</button>
    </div>
  );
}

function ItemRow({ item, meta, count, setCount, editing, onEdit, onDelete, onMove }) {
  return (
    <article id={`tetel-${item.id}`} className="grid gap-x-6 gap-y-2 border-b border-line py-5 last:border-b-0 sm:grid-cols-[5.5rem_1fr_auto]">
      <div className="display text-3xl font-bold text-uniform num">{item.paragraph}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold leading-snug">{item.title}</h3>
          <Pill tone={CATEGORY_TONE[item.category]}>{meta.categories[item.category]}</Pill>
        </div>
        {item.description && <p className="mt-1 max-w-[70ch] text-steel">{item.description}</p>}
        {item.flags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.flags.map((f) => <Pill key={f} tone={f === 'korozheto' ? 'red' : 'blue'}>{meta.flags[f]}</Pill>)}
          </div>
        )}
      </div>
      <div className="flex flex-row items-center gap-5 sm:flex-col sm:items-end sm:gap-2">
        <dl className="text-right text-sm">
          <dt className="sr-only">Bírság</dt>
          <dd className="font-semibold num">{formatMoneyRange(item.fine_min, item.fine_max)}</dd>
          <dt className="sr-only">Börtön</dt>
          <dd className="text-steel num">{item.jail_max ? `${formatRange(item.jail_min, item.jail_max)} hónap` : 'nincs börtön'}</dd>
        </dl>
        {editing ? (
          <div className="flex gap-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMove(-1)} aria-label="Feljebb">↑</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMove(1)} aria-label="Lejjebb">↓</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>Szerkesztés</button>
            <button type="button" className="btn btn-ghost btn-sm text-siren-red" onClick={onDelete}>Törlés</button>
          </div>
        ) : (
          <Counter count={count} onChange={setCount} title={item.title} />
        )}
      </div>
    </article>
  );
}

function Ticket({ result, meta, onClear, setCount }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(summaryText(result, meta.flags));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <aside aria-label="Bírságcédula" className="sheet overflow-hidden">
      <div className="flex items-center justify-between bg-ink px-5 py-3 text-white">
        <h2 className="display text-2xl font-bold">Bírságcédula</h2>
        <span className="text-sm text-white/70 num">{result.lines.length} tétel</span>
      </div>
      {result.lines.length === 0 ? (
        <p className="px-5 py-6 text-sm text-steel">Add a tételeket a „+ Cédulára” gombbal. A cédula összeadja a bírságot és a börtönidőt.</p>
      ) : (
        <>
          <ul className="max-h-72 divide-y divide-line overflow-y-auto px-5">
            {result.lines.map(({ item, count }) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span><span className="font-semibold num">{item.paragraph}</span> {item.title}{count > 1 && <span className="text-steel num"> ×{count}</span>}</span>
                <button type="button" className="text-mute hover:text-siren-red" onClick={() => setCount(item.id, 0)} aria-label={`${item.title} eltávolítása`}>✕</button>
              </li>
            ))}
          </ul>
          <dl className="border-t-2 border-dashed border-line px-5 py-4">
            <div className="flex justify-between"><dt className="text-steel">Bírság</dt><dd className="text-xl font-bold num">{formatMoneyRange(result.fineMin, result.fineMax)}</dd></div>
            <div className="mt-1 flex justify-between"><dt className="text-steel">Börtön</dt><dd className="text-xl font-bold num">{result.jailMax ? `${formatRange(result.jailMin, result.jailMax)} hónap` : 'nincs'}</dd></div>
            {result.capped && <p className="mt-2 text-xs text-warn">A halmazati börtönidő legfeljebb 150 hónap. Ennél többet csak a DOJ bírája szabhat ki.</p>}
            {result.flags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">{result.flags.map((f) => <Pill key={f} tone={f === 'korozheto' ? 'red' : 'blue'}>{meta.flags[f]}</Pill>)}</div>
            )}
          </dl>
          <div className="flex gap-2 border-t border-line px-5 py-4">
            <button type="button" className="btn btn-primary flex-1" onClick={copy}>{copied ? 'Kimásolva ✓' : 'Másolás MDT-be'}</button>
            <button type="button" className="btn btn-ghost" onClick={onClear}>Új cédula</button>
          </div>
        </>
      )}
    </aside>
  );
}

export default function Btk() {
  const { can } = useAuth();
  const live = useApi('/api/btk');
  const { loading, reload } = live;
  // Ha a bot szervere nem érhető el, a beépített (kiadáskori) BTK-másolat jelenik meg, szerkesztés nélkül.
  const offline = !!live.error && !live.data;
  const data = live.data ?? (offline ? BTK_FALLBACK : null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selection, setSelection] = useState({});
  const [editing, setEditing] = useState(false);
  const [itemEdit, setItemEdit] = useState(null);
  const [chapterEdit, setChapterEdit] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [ticketOpen, setTicketOpen] = useState(false);

  const allItems = useMemo(() => data?.chapters.flatMap((c) => c.items) ?? [], [data]);
  const result = useMemo(() => calculate(allItems, selection), [allItems, selection]);
  const setCount = (id, n) => setSelection((s) => ({ ...s, [id]: Math.max(0, Math.min(20, n)) }));

  const needle = query.trim().toLowerCase();
  const chapters = useMemo(() => (data?.chapters ?? []).map((c) => ({
    ...c,
    visible: c.items.filter((i) =>
      (!category || i.category === category) &&
      (!needle || `${i.paragraph} ${i.title} ${i.description}`.toLowerCase().includes(needle))),
  })), [data, category, needle]);

  if (loading) return <Loading />;
  const meta = { categories: data.categories, flags: data.flags };
  const filtering = !!(needle || category);

  const run = async (fn) => {
    setActionError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setActionError(err);
    }
  };
  const move = (chapter, index, dir) => run(async () => {
    const ids = chapter.items.map((i) => i.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await api('/api/btk/sorrend', { method: 'PUT', body: { items: { [chapter.id]: ids } } });
  });

  return (
    <>
      <PageHeader
        title="Büntető Törvénykönyv"
        intro={`Az ICON LSPD hatályos BTK-ja: ${allItems.length} tétel, ${data.chapters.length} fejezetben. A bírság dollárban, a börtönidő hónapban értendő (RP-ben 1 hónap = 1 perc).`}
        actions={
          <>
            <button type="button" className="btn btn-ghost no-print" onClick={() => window.print()}>Nyomtatás</button>
            {can('vezeto') && !offline && (
              <button type="button" className={`btn no-print ${editing ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setEditing((e) => !e)}>
                {editing ? 'Szerkesztés befejezése' : 'Szerkesztés'}
              </button>
            )}
          </>
        }
      />
      <ErrorNote error={actionError} />
      {offline && (
        <p className="no-print mb-6 rounded-md border border-warn/40 bg-warn/10 px-4 py-3 text-sm" role="status">
          A szerver most nem érhető el, ezért a BTK beépített másolatát látod. A vezetőség legutóbbi módosításai akkor jelennek meg, amikor a szerver újra elérhető.
        </p>
      )}

      <div className="no-print mb-6 flex flex-wrap gap-3">
        <input type="search" className="input max-w-md" placeholder="Keresés: név, paragrafus, leírás…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Keresés a BTK-ban" />
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Szűrés kategóriára">
          <option value="">Minden kategória</option>
          {Object.entries(meta.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {editing && <button type="button" className="btn btn-primary" onClick={() => setChapterEdit({})}>Új fejezet</button>}
      </div>

      <div className="grid gap-8 xl:grid-cols-[13rem_1fr_21rem] lg:grid-cols-[1fr_21rem]">
        <nav aria-label="Fejezetek" className="no-print hidden xl:block">
          <ol className="sticky top-24 space-y-1 text-sm">
            {chapters.map((c) => (
              <li key={c.id}>
                <a href={`#fejezet-${c.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`fejezet-${c.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} className="flex gap-2 rounded px-2 py-1.5 text-steel hover:bg-sheet hover:text-ink">
                  <span className="w-8 shrink-0 font-semibold text-uniform">{c.number}</span>
                  <span>{c.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 pb-20 lg:pb-0">
          {chapters.filter((c) => !filtering || c.visible.length).map((c) => (
            <section key={c.id} id={`fejezet-${c.id}`} className="mb-10 scroll-mt-24">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-2">
                <h2 className="display text-3xl font-bold"><span className="mr-3 text-gold">{c.number}</span>{c.title}</h2>
                {editing && (
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItemEdit({ chapter_id: c.id })}>Új tétel</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setChapterEdit(c)}>Fejezet szerkesztése</button>
                    <button type="button" className="btn btn-ghost btn-sm text-siren-red" onClick={() => confirm(`Törlöd a(z) ${c.number} fejezetet?`) && run(() => api(`/api/btk/fejezetek/${c.id}`, { method: 'DELETE' }))}>Törlés</button>
                  </div>
                )}
              </div>
              {c.description && !filtering && <Markdown text={c.description} className="mt-4 text-[0.95rem] text-steel" />}
              <div>
                {(filtering ? c.visible : c.items).map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    meta={meta}
                    count={selection[item.id] ?? 0}
                    setCount={(n) => setCount(item.id, n)}
                    editing={editing}
                    onEdit={() => setItemEdit(item)}
                    onDelete={() => confirm(`Törlöd: ${item.paragraph} ${item.title}?`) && run(() => api(`/api/btk/tetelek/${item.id}`, { method: 'DELETE' }))}
                    onMove={(dir) => move(c, index, dir)}
                  />
                ))}
              </div>
            </section>
          ))}
          {filtering && chapters.every((c) => !c.visible.length) && <p className="text-steel">Nincs találat. Próbálj rövidebb kifejezést.</p>}
        </div>

        <div className="no-print hidden lg:block">
          <div className="sticky top-24">
            <Ticket result={result} meta={meta} onClear={() => setSelection({})} setCount={setCount} />
          </div>
        </div>
      </div>

      {result.lines.length > 0 && (
        <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-line bg-sheet px-4 py-3 shadow-[0_-6px_20px_rgb(16_33_63/0.12)] lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold num">{formatMoneyRange(result.fineMin, result.fineMax)}</p>
              <p className="text-steel num">{result.lines.length} tétel · {result.jailMax ? `${formatRange(result.jailMin, result.jailMax)} hónap` : 'nincs börtön'}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setTicketOpen(true)}>Cédula</button>
          </div>
        </div>
      )}
      <Modal open={ticketOpen} title="Bírságcédula" onClose={() => setTicketOpen(false)}>
        <Ticket result={result} meta={meta} onClear={() => { setSelection({}); setTicketOpen(false); }} setCount={setCount} />
      </Modal>

      <ItemEditor value={itemEdit} chapters={data.chapters} meta={meta} onClose={() => setItemEdit(null)} onSaved={() => { setItemEdit(null); reload(); }} />
      <ChapterEditor value={chapterEdit} onClose={() => setChapterEdit(null)} onSaved={() => { setChapterEdit(null); reload(); }} />
    </>
  );
}
