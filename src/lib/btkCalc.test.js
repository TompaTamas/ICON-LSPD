import { describe, expect, it } from 'vitest';
import { calculate, summaryText } from './btkCalc.js';

const items = [
  { id: 1, paragraph: '13. §', title: 'Ittas vezetés', fine_min: 1500, fine_max: 3000, jail_min: 5, jail_max: 15, flags: ['jogositvany', 'jarmu'] },
  { id: 2, paragraph: '62. §', title: 'Fegyveres rablás', fine_min: 15000, fine_max: 30000, jail_min: 50, jail_max: 80, flags: ['korozheto', 'fegyver'] },
];

describe('bírság-kalkulátor', () => {
  it('összeadja a kiválasztott tételeket darabszámmal', () => {
    const r = calculate(items, { 1: 2 });
    expect(r.fineMin).toBe(3000);
    expect(r.fineMax).toBe(6000);
    expect(r.jailMax).toBe(30);
    expect(r.flags).toEqual(['jogositvany', 'jarmu']);
  });

  it('a börtönidőt 150 hónapnál korlátozza', () => {
    const r = calculate(items, { 2: 2 });
    expect(r.jailMax).toBe(150);
    expect(r.capped).toBe(true);
  });

  it('MDT-be másolható szöveget készít', () => {
    const text = summaryText(calculate(items, { 1: 1 }), { jogositvany: 'Jogosítvány-bevonás', jarmu: 'Járműlefoglalás' });
    expect(text).toContain('13. § Ittas vezetés');
    expect(text).toContain('5–15 hónap');
    expect(text).toContain('Jogosítvány-bevonás, Járműlefoglalás');
  });
});
