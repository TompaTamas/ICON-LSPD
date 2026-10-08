import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 3 38 10l9-2 2 9 8 5-4 8 4 8-8 5-2 9-9-2-6 7-6-7-9 2-2-9-8-5 4-8-4-8 8-5 2-9 9 2z" fill="#C8A13A" />
      <path d="M32 9.5 37 15l7.2-1.5 1.6 7.2 6.3 4-3.2 6.3 3.2 6.3-6.3 4-1.6 7.2L37 47l-5 5.5-5-5.5-7.2 1.5-1.6-7.2-6.3-4 3.2-6.3-3.2-6.3 6.3-4 1.6-7.2L27 15z" fill="#10213F" />
      <path d="m32 20 3.5 7.6 8.3.9-6.2 5.6 1.8 8.2L32 38.1l-7.4 4.2 1.8-8.2-6.2-5.6 8.3-.9z" fill="#C8A13A" />
    </svg>
  );
}

/** Oldalfejléc: nagy kijelzőbetűs cím, rövid magyarázat, opcionális műveletek jobbra. */
export function PageHeader({ title, intro, actions }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="max-w-2xl">
        <h1 className="display text-5xl font-extrabold text-ink sm:text-6xl">{title}</h1>
        {intro && <p className="mt-3 text-steel">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Loading({ text = 'Betöltés…' }) {
  return (
    <div className="flex items-center gap-3 py-10 text-steel" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-uniform" />
      {text}
    </div>
  );
}

export function ErrorNote({ error, children }) {
  if (!error && !children) return null;
  return (
    <div className="rounded-md border border-siren-red/30 bg-siren-red/5 px-4 py-3 text-sm text-siren-red" role="alert">
      {children ?? error?.message ?? String(error)}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-steel">{children}</div>}
    </div>
  );
}

const PILL_TONES = {
  gray: 'bg-paper text-steel border-line',
  blue: 'bg-uniform/10 text-uniform border-uniform/20',
  green: 'bg-ok/10 text-ok border-ok/25',
  red: 'bg-siren-red/10 text-siren-red border-siren-red/25',
  gold: 'bg-gold-soft text-[#7a5e14] border-gold/40',
  orange: 'bg-warn/10 text-warn border-warn/25',
};

export function Pill({ tone = 'gray', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PILL_TONES[tone]} ${className}`}>{children}</span>;
}

export function Avatar({ src, name, size = 32 }) {
  if (src) return <img src={src} alt="" width={size} height={size} className="rounded-full bg-line object-cover" style={{ width: size, height: size }} />;
  const initials = (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-uniform text-xs font-bold text-white" style={{ width: size, height: size }} aria-hidden="true">
      {initials}
    </span>
  );
}

export function Markdown({ text, className = '' }) {
  const html = DOMPurify.sanitize(marked.parse(text ?? '', { breaks: true }));
  return <div className={`prose-lspd ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Modal({ open, title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-4xl' : 'max-w-xl'} rounded-xl border border-line bg-sheet p-0 text-ink shadow-2xl backdrop:bg-ink/50`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="display text-2xl font-bold">{title}</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Bezárás">✕</button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-line" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${value === t.value ? 'border-gold text-ink' : 'border-transparent text-steel hover:text-ink'}`}
        >
          {t.label}
          {t.count != null && <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-xs text-steel num">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
