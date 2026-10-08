export const MAX_JAIL = 150;

/**
 * Bírság-kalkulátor: a kiválasztott tételek (id → darab) összesítése.
 * A börtönidő halmazatban legfeljebb 150 hónap (BTK I. fejezet, 4. pont).
 */
export function calculate(items, selection) {
  let fineMin = 0;
  let fineMax = 0;
  let jailMin = 0;
  let jailMax = 0;
  const flags = new Set();
  const lines = [];
  for (const item of items) {
    const count = selection[item.id] ?? 0;
    if (!count) continue;
    fineMin += item.fine_min * count;
    fineMax += item.fine_max * count;
    jailMin += item.jail_min * count;
    jailMax += item.jail_max * count;
    item.flags.forEach((f) => flags.add(f));
    lines.push({ item, count });
  }
  return {
    lines,
    fineMin,
    fineMax,
    jailMin: Math.min(jailMin, MAX_JAIL),
    jailMax: Math.min(jailMax, MAX_JAIL),
    capped: jailMax > MAX_JAIL,
    flags: [...flags],
  };
}

/** Szöveges összefoglaló, amit az officer bemásolhat az MDT-be. */
export function summaryText(result, flagLabels = {}) {
  const items = result.lines.map(({ item, count }) => `${item.paragraph} ${item.title}${count > 1 ? ` (${count}×)` : ''}`).join('; ');
  const money = (n) => `$${n.toLocaleString('hu-HU')}`;
  const fine = result.fineMin === result.fineMax ? money(result.fineMin) : `${money(result.fineMin)} – ${money(result.fineMax)}`;
  const jail = result.jailMax === 0 ? 'nincs' : result.jailMin === result.jailMax ? `${result.jailMin} hónap` : `${result.jailMin}–${result.jailMax} hónap`;
  const flags = result.flags.map((f) => flagLabels[f] ?? f).join(', ');
  return `BTK: ${items} | Bírság: ${fine} | Börtön: ${jail}${flags ? ` | ${flags}` : ''}`;
}
