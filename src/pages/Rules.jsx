import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { Empty, ErrorNote, Field, Loading, Markdown, Modal, PageHeader } from '../components/ui.jsx';

function SectionEditor({ value, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', content_md: '' });
  const [error, setError] = useState(null);
  useEffect(() => {
    if (value) {
      setForm({ title: value.title ?? '', content_md: value.content_md ?? '' });
      setError(null);
    }
  }, [value]);
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(value.id ? `/api/szabalyzat/${value.id}` : '/api/szabalyzat', { method: value.id ? 'PUT' : 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err);
    }
  };
  return (
    <Modal open={!!value} wide title={value?.id ? 'Fejezet szerkesztése' : 'Új fejezet'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Cím"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Szöveg" hint="Markdown: # Cím, **félkövér**, - lista, 1. számozott lista, > kiemelés">
            <textarea className="input min-h-[22rem] font-mono text-sm" value={form.content_md} onChange={(e) => setForm({ ...form, content_md: e.target.value })} />
          </Field>
          <div>
            <span className="label">Előnézet</span>
            <div className="min-h-[22rem] overflow-y-auto rounded-md border border-line bg-paper p-4"><Markdown text={form.content_md} /></div>
          </div>
        </div>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Mégse</button>
          <button type="submit" className="btn btn-primary">Mentés</button>
        </div>
      </form>
    </Modal>
  );
}

function Versions({ section, onClose, onRestored }) {
  const { data, loading } = useApi(section ? `/api/szabalyzat/${section.id}/verziok` : null);
  const [preview, setPreview] = useState(null);
  const restore = async (rev) => {
    if (!confirm('Visszaállítod ezt a verziót? A jelenlegi szöveg is megmarad a verziók között.')) return;
    await api(`/api/szabalyzat/${section.id}/visszaallit/${rev.id}`, { method: 'POST' });
    onRestored();
  };
  return (
    <Modal open={!!section} wide title={`Verziók – ${section?.title ?? ''}`} onClose={() => { setPreview(null); onClose(); }}>
      {loading && <Loading />}
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <ul className="space-y-1">
          {(data ?? []).filter((r) => r.after).map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => setPreview(r)} className={`w-full rounded px-3 py-2 text-left text-sm ${preview?.id === r.id ? 'bg-uniform/10' : 'hover:bg-paper'}`}>
                <span className="block font-semibold">{formatDateTime(r.created_at)}</span>
                <span className="text-steel">{r.action === 'letrehozas' ? 'Létrehozás' : 'Módosítás'}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-md border border-line p-4">
          {preview ? (
            <>
              <Markdown text={preview.after.content_md} />
              <button type="button" className="btn btn-primary mt-4" onClick={() => restore(preview)}>Ennek a verziónak a visszaállítása</button>
            </>
          ) : (
            <p className="text-steel">Válassz egy verziót a bal oldalon.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Rules() {
  const { can } = useAuth();
  const { data, error, loading, reload } = useApi('/api/szabalyzat');
  const [edit, setEdit] = useState(null);
  const [versions, setVersions] = useState(null);
  const [query, setQuery] = useState('');
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  const leader = can('vezeto');
  const needle = query.trim().toLowerCase();
  const sections = data.filter((s) => !needle || `${s.title} ${s.content_md}`.toLowerCase().includes(needle));

  const remove = async (s) => {
    if (!confirm(`Törlöd a(z) „${s.title}” fejezetet?`)) return;
    await api(`/api/szabalyzat/${s.id}`, { method: 'DELETE' });
    reload();
  };
  const move = async (index, dir) => {
    const ids = data.map((s) => s.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await api('/api/szabalyzat/sorrend', { method: 'PUT', body: { ids } });
    reload();
  };

  return (
    <>
      <PageHeader
        title="Szabályzat"
        intro="Az ICON LSPD belső szabályzata. Minden tag köteles ismerni és betartani."
        actions={leader && <button type="button" className="btn btn-primary" onClick={() => setEdit({})}>Új fejezet</button>}
      />
      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Tartalomjegyzék" className="lg:sticky lg:top-24 lg:self-start">
          <input type="search" className="input mb-4" placeholder="Keresés a szabályzatban…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Keresés a szabályzatban" />
          <ol className="space-y-1 text-sm">
            {sections.map((s) => (
              <li key={s.id}><a href={`#szabaly-${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`szabaly-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} className="block rounded px-2 py-1.5 text-steel hover:bg-sheet hover:text-ink">{s.title}</a></li>
            ))}
          </ol>
        </nav>
        <div>
          {sections.length === 0 && <Empty title="Nincs találat">Próbálj más kifejezést.</Empty>}
          {sections.map((s) => (
            <section key={s.id} id={`szabaly-${s.id}`} className="mb-12 scroll-mt-24 border-b border-line pb-10 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="display text-4xl font-bold">{s.title}</h2>
                {leader && (
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(data.indexOf(s), -1)} aria-label="Feljebb">↑</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(data.indexOf(s), 1)} aria-label="Lejjebb">↓</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(s)}>Szerkesztés</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVersions(s)}>Verziók</button>
                    <button type="button" className="btn btn-ghost btn-sm text-siren-red" onClick={() => remove(s)}>Törlés</button>
                  </div>
                )}
              </div>
              <Markdown text={s.content_md} className="mt-3" />
              {s.updated_at && <p className="mt-4 text-xs text-mute">Utoljára módosítva: {formatDateTime(s.updated_at)}</p>}
            </section>
          ))}
        </div>
      </div>
      <SectionEditor value={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />
      <Versions section={versions} onClose={() => setVersions(null)} onRestored={() => { setVersions(null); reload(); }} />
    </>
  );
}
