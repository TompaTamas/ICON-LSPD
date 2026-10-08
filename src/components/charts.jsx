import { useState } from 'react';
import { formatDuration } from '../lib/format.js';

/**
 * Napi szolgálati idő oszlopdiagramja (egy adatsor, ezért jelmagyarázat nincs – a cím nevezi meg).
 * Vékony oszlopok, alapvonalhoz rögzített 4px-es lekerekítés, 2px rés, egérrel / fókusszal tooltip.
 */
export function DayBars({ days, height = 160 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(3600, ...days.map((d) => d.seconds));
  return (
    <figure>
      <div className="relative flex items-end gap-[2px] border-b border-line" style={{ height }} role="img" aria-label={days.map((d) => `${d.name}: ${formatDuration(d.seconds, true)}`).join(', ')}>
        {days.map((d, i) => {
          const h = d.seconds ? Math.max(4, (d.seconds / max) * (height - 8)) : 0;
          return (
            <button
              key={d.date}
              type="button"
              className="group relative flex h-full flex-1 items-end justify-center focus:outline-none"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.name}: ${formatDuration(d.seconds, true)}`}
            >
              <span className="w-full max-w-10 rounded-t bg-data transition-opacity group-hover:opacity-85" style={{ height: h }} />
              {hover === i && (
                <span className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
                  <span className="block font-semibold">{d.name} · {d.date.slice(5).replace('-', '. ')}.</span>
                  {formatDuration(d.seconds, true)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[2px] text-center text-xs text-steel">
        {days.map((d) => (
          <span key={d.date} className="flex-1">
            <span className="block font-semibold text-ink">{d.name}</span>
            <span className="num">{d.seconds ? formatDuration(d.seconds) : '–'}</span>
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Rangsor vízszintes sávokkal; az értékek felirattal is ott vannak, így a sáv csak kiegészítés. */
export function RankBars({ rows, valueOf, labelOf, renderName }) {
  const max = Math.max(1, ...rows.map(valueOf));
  return (
    <ol className="divide-y divide-line">
      {rows.map((row, i) => (
        <li key={row.discordId ?? i} className="grid grid-cols-[2.5rem_minmax(8rem,14rem)_1fr_auto] items-center gap-4 py-3">
          <span className={`display text-2xl font-bold num ${i < 3 ? 'text-gold' : 'text-mute'}`}>{i + 1}.</span>
          <span className="min-w-0 truncate">{renderName(row)}</span>
          <span className="h-3 rounded-r bg-data/90" style={{ width: `${Math.max(2, (valueOf(row) / max) * 100)}%` }} aria-hidden="true" />
          <span className="text-right font-semibold num">{labelOf(row)}</span>
        </li>
      ))}
    </ol>
  );
}
