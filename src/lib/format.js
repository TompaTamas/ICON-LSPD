const TZ = 'Europe/Budapest';

const fmt = (options) => new Intl.DateTimeFormat('hu-HU', { timeZone: TZ, ...options });
const dateTimeFmt = fmt({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const dateFmt = fmt({ year: 'numeric', month: 'long', day: 'numeric' });
const shortDateFmt = fmt({ month: 'short', day: 'numeric', weekday: 'short' });
const timeFmt = fmt({ hour: '2-digit', minute: '2-digit' });
const money = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 });

export const formatDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');
export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const formatShortDate = (iso) => shortDateFmt.format(new Date(iso));
export const formatTime = (iso) => timeFmt.format(new Date(iso));
export const formatMoney = (n) => `$${money.format(n)}`;
export const formatRange = (min, max, unit = '') => (min === max ? `${money.format(min)}${unit}` : `${money.format(min)}–${money.format(max)}${unit}`);
export const formatMoneyRange = (min, max) => (min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`);

/** Másodperc → „3 ó 12 p” / „45 p”. */
export function formatDuration(seconds, long = false) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (long) return h ? `${h} óra ${m} perc` : `${m} perc`;
  return h ? `${h} ó ${m} p` : `${m} p`;
}

/** Budapesti dátumkulcs (ÉÉÉÉ-HH-NN) egy időpontból. */
export const dayKey = (iso) => fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)).replace(/\.\s?/g, '-').replace(/-$/, '');

export const MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
