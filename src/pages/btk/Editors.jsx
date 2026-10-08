import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ErrorNote, Field, Modal } from '../../components/ui.jsx';

const EMPTY_ITEM = { paragraph: '', title: '', description: '', category: 'vetseg', fine_min: 0, fine_max: 0, jail_min: 0, jail_max: 0, flags: [] };

export function ItemEditor({ value, chapters, meta, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_ITEM);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (value) {
      setForm({ ...EMPTY_ITEM, ...value, chapter_id: value.chapter_id ?? chapters[0]?.id });
      setError(null);
    }
  }, [value, chapters]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
  const toggleFlag = (flag) => setForm((f) => ({ ...f, flags: f.flags.includes(flag) ? f.flags.filter((x) => x !== flag) : [...f.flags, flag] }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      chapter_id: Number(form.chapter_id), paragraph: form.paragraph, title: form.title, description: form.description,
      category: form.category, fine_min: form.fine_min, fine_max: form.fine_max, jail_min: form.jail_min, jail_max: form.jail_max, flags: form.flags,
    };
    try {
      await api(value.id ? `/api/btk/tetelek/${value.id}` : '/api/btk/tetelek', { method: value.id ? 'PUT' : 'POST', body });
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!value} title={value?.id ? 'Tétel szerkesztése' : 'Új BTK-tétel'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Field label="Paragrafus"><input className="input" value={form.paragraph} onChange={set('paragraph')} placeholder="pl. 112. §" required /></Field>
          <Field label="Megnevezés"><input className="input" value={form.title} onChange={set('title')} required /></Field>
        </div>
        <Field label="Fejezet">
          <select className="input" value={form.chapter_id ?? ''} onChange={set('chapter_id')}>
            {chapters.map((c) => <option key={c.id} value={c.id}>{c.number} {c.title}</option>)}
          </select>
        </Field>
        <Field label="Leírás"><textarea className="input min-h-24" value={form.description} onChange={set('description')} /></Field>
        <Field label="Kategória">
          <select className="input" value={form.category} onChange={set('category')}>
            {Object.entries(meta.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Bírság min. ($)"><input type="number" min="0" className="input num" value={form.fine_min} onChange={set('fine_min')} /></Field>
          <Field label="Bírság max. ($)"><input type="number" min="0" className="input num" value={form.fine_max} onChange={set('fine_max')} /></Field>
          <Field label="Börtön min. (hó)"><input type="number" min="0" className="input num" value={form.jail_min} onChange={set('jail_min')} /></Field>
          <Field label="Börtön max. (hó)"><input type="number" min="0" className="input num" value={form.jail_max} onChange={set('jail_max')} /></Field>
        </div>
        <fieldset>
          <legend className="label">Jelölők</legend>
          <div className="flex flex-wrap gap-4">
            {Object.entries(meta.flags).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.flags.includes(k)} onChange={() => toggleFlag(k)} /> {v}
              </label>
            ))}
          </div>
        </fieldset>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Mégse</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Mentés…' : 'Mentés'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function ChapterEditor({ value, onClose, onSaved }) {
  const [form, setForm] = useState({ number: '', title: '', description: '' });
  const [error, setError] = useState(null);
  useEffect(() => {
    if (value) {
      setForm({ number: value.number ?? '', title: value.title ?? '', description: value.description ?? '' });
      setError(null);
    }
  }, [value]);
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(value.id ? `/api/btk/fejezetek/${value.id}` : '/api/btk/fejezetek', { method: value.id ? 'PUT' : 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err);
    }
  };
  return (
    <Modal open={!!value} title={value?.id ? 'Fejezet szerkesztése' : 'Új fejezet'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
          <Field label="Szám"><input className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="XI." required /></Field>
          <Field label="Cím"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        </div>
        <Field label="Bevezető szöveg" hint="Markdown: **félkövér**, - lista, stb."><textarea className="input min-h-32" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Mégse</button>
          <button type="submit" className="btn btn-primary">Mentés</button>
        </div>
      </form>
    </Modal>
  );
}
