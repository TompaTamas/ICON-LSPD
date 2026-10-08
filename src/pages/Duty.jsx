import { useState } from 'react';
import { useApi } from '../lib/useApi.js';
import { formatDuration } from '../lib/format.js';
import { Avatar, Empty, ErrorNote, Loading, PageHeader, Tabs } from '../components/ui.jsx';
import { RankBars } from '../components/charts.jsx';

const PERIODS = [
  { value: 'het', label: 'Hét' },
  { value: 'honap', label: 'Hónap' },
  { value: 'ev', label: 'Év' },
];
const KIND_LABEL = { het: 'A hét officere', honap: 'A hónap officere', ev: 'Az év officere' };

function HallOfFame() {
  const { data, loading, error } = useApi('/api/dijak');
  if (loading) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!data.length) return <Empty title="Még nincs díjazott">Az első heti díjat hétfőn hajnalban osztja ki a bot.</Empty>;
  const latest = ['ev', 'honap', 'het'].map((k) => data.find((d) => d.kind === k)).filter(Boolean);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {latest.map((d) => (
          <div key={d.id} className="rounded-xl border border-gold/50 bg-gold-soft/50 p-5">
            <p className="text-sm font-semibold text-[#7a5e14]">{KIND_LABEL[d.kind]}</p>
            <p className="text-xs text-steel">{d.idoszak}</p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar src={d.avatar} name={d.nev} size={44} />
              <div>
                <p className="display text-2xl font-bold">{d.nev}</p>
                <p className="text-sm text-steel num">{formatDuration(d.seconds, true)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <h3 className="display mt-10 mb-3 text-2xl font-bold">Korábbi díjazottak</h3>
      <div className="sheet overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-steel"><tr><th className="px-4 py-2.5">Díj</th><th className="px-4 py-2.5">Időszak</th><th className="px-4 py-2.5">Officer</th><th className="px-4 py-2.5 text-right">Idő</th></tr></thead>
          <tbody className="divide-y divide-line">
            {data.map((d) => (
              <tr key={d.id}><td className="px-4 py-2.5">{KIND_LABEL[d.kind]}</td><td className="px-4 py-2.5 text-steel">{d.idoszak}</td><td className="px-4 py-2.5 font-semibold">{d.nev}</td><td className="px-4 py-2.5 text-right num">{formatDuration(d.seconds)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Duty() {
  const [view, setView] = useState('het');
  const [offset, setOffset] = useState(0);
  const board = useApi(view === 'dijak' ? null : `/api/szolgalat/toplista?idoszak=${view}&eltolas=${offset}`, { refreshMs: 60_000 });

  return (
    <>
      <PageHeader title="Szolgálat" intro="Ki mennyi időt töltött szolgálatban. A heti, havi és éves első helyezett automatikusan megkapja az Officer Of The Week / Month / Year rangot." />
      <Tabs value={view} onChange={(v) => { setView(v); setOffset(0); }} tabs={[...PERIODS, { value: 'dijak', label: 'Hírességek csarnoka' }]} />
      {view === 'dijak' ? (
        <HallOfFame />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOffset(offset - 1)}>Előző</button>
            <h2 className="display text-center text-3xl font-bold">{board.data?.label ?? '…'}</h2>
            <button type="button" className="btn btn-ghost btn-sm" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>Következő</button>
          </div>
          {board.loading && <Loading />}
          <ErrorNote error={board.error} />
          {board.data && board.data.rows.length === 0 && <Empty title="Ebben az időszakban nem volt szolgálat">A szolgálati időt a FiveM szerver küldi, amikor valaki szolgálatba lép.</Empty>}
          {board.data && board.data.rows.length > 0 && (
            <div className="sheet px-5">
              <RankBars
                rows={board.data.rows}
                valueOf={(r) => r.seconds}
                labelOf={(r) => formatDuration(r.seconds)}
                renderName={(r) => (
                  <span className="flex items-center gap-2.5">
                    <Avatar src={r.avatar} name={r.nev} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.nev}</span>
                      <span className="block truncate text-xs text-steel">{[r.callsign, `${r.sessions} szolgálat`].filter(Boolean).join(' · ')}</span>
                    </span>
                  </span>
                )}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
