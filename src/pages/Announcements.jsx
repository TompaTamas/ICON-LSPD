import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { Empty, ErrorNote, Field, Loading, Markdown, Modal, PageHeader } from '../components/ui.jsx';

function Editor({ value, onClose, onSaved }) {
  const [form, setForm] = useState({ cim: '', tartalom: '' });
  const [error, setError] = useState(null);
  useEffect(() => {
    if (value) {
      setForm({ cim: value.title ?? '', tartalom: value.content_md ?? '' });
      setError(null);
    }
  }, [value]);
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(value.id ? `/api/kozlemenyek/${value.id}` : '/api/kozlemenyek', { method: value.id ? 'PUT' : 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err);
    }
  };
  return (
    <Modal open={!!value} wide title={value?.id ? 'Közlemény szerkesztése' : 'Új közlemény'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Cím"><input className="input" value={form.cim} onChange={(e) => setForm({ ...form, cim: e.target.value })} required /></Field>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Szöveg" hint="Markdown támogatott. A Discordon a közlemények csatornában is megjelenik.">
            <textarea className="input min-h-60" value={form.tartalom} onChange={(e) => setForm({ ...form, tartalom: e.target.value })} required />
          </Field>
          <div><span className="label">Előnézet</span><div className="min-h-60 rounded-md border border-line bg-paper p-4"><Markdown text={form.tartalom} /></div></div>
        </div>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Mégse</button>
          <button type="submit" className="btn btn-primary">{value?.id ? 'Mentés' : 'Közzététel'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Announcements() {
  const { can } = useAuth();
  const { data, error, loading, reload } = useApi('/api/kozlemenyek');
  const [edit, setEdit] = useState(null);
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  const remove = async (a) => {
    if (!confirm(`Törlöd a(z) „${a.title}” közleményt? A Discordról is eltűnik.`)) return;
    await api(`/api/kozlemenyek/${a.id}`, { method: 'DELETE' });
    reload();
  };
  return (
    <>
      <PageHeader
        title="Közlemények"
        intro="A vezetőség hivatalos közleményei. Mindegyik a Discord közlemények csatornájában is megjelenik."
        actions={can('vezeto') && <button type="button" className="btn btn-primary" onClick={() => setEdit({})}>Új közlemény</button>}
      />
      {data.length === 0 && <Empty title="Még nincs közlemény" />}
      <div className="max-w-3xl space-y-10">
        {data.map((a) => (
          <article key={a.id} className="border-l-4 border-gold pl-6">
            <h2 className="display text-3xl font-bold">{a.title}</h2>
            <p className="mb-3 text-sm text-steel">{formatDateTime(a.created_at)}{a.szerzo ? ` · ${a.szerzo}` : ''}{a.updated_at !== a.created_at ? ' · szerkesztve' : ''}</p>
            <Markdown text={a.content_md} />
            {can('vezeto') && (
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(a)}>Szerkesztés</button>
                <button type="button" className="btn btn-ghost btn-sm text-siren-red" onClick={() => remove(a)}>Törlés</button>
              </div>
            )}
          </article>
        ))}
      </div>
      <Editor value={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />
    </>
  );
}
