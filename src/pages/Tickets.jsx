import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { formatDateTime } from '../lib/format.js';
import { Empty, ErrorNote, Loading, PageHeader, Pill } from '../components/ui.jsx';

export default function Tickets() {
  const { can } = useAuth();
  const [all, setAll] = useState(false);
  const { data, error, loading } = useApi(`/api/ticketek${all ? '?mind=1' : ''}`);
  const [openError, setOpenError] = useState(null);

  const openTranscript = async (t) => {
    setOpenError(null);
    const win = window.open('', '_blank');
    try {
      const res = await api(`/api/ticketek/${t.id}/atirat`, { raw: true });
      const url = URL.createObjectURL(new Blob([await res.text()], { type: 'text/html' }));
      if (win) win.location.href = url;
    } catch (err) {
      win?.close();
      setOpenError(err);
    }
  };

  return (
    <>
      <PageHeader
        title={all ? 'Összes ticket' : 'Ticketjeim'}
        intro="Ticketet a Discordon nyithatsz a ticketek csatornában: válassz kategóriát, és kapsz egy privát csatornát. Itt követheted az állapotukat, és visszanézheted a lezártak átiratát."
        actions={can('felugyelo') && <button type="button" className="btn btn-ghost" onClick={() => setAll(!all)}>{all ? 'Csak a sajátjaim' : 'Összes ticket'}</button>}
      />
      <ErrorNote error={openError} />
      {loading && <Loading />}
      <ErrorNote error={error} />
      {data && data.length === 0 && <Empty title="Nincs ticket">Ha segítség kell, a Discordon a ticketek csatornában nyithatsz egyet.</Empty>}
      {data && data.length > 0 && (
        <div className="sheet overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-steel">
              <tr><th className="px-4 py-3">Szám</th><th className="px-4 py-3">Tárgy</th><th className="px-4 py-3">Kategória</th>{all && <th className="px-4 py-3">Nyitotta</th>}<th className="px-4 py-3">Nyitva</th><th className="px-4 py-3">Állapot</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-semibold num">#{t.number}</td>
                  <td className="px-4 py-3">{t.subject}</td>
                  <td className="px-4 py-3 text-steel">{t.kategoria}</td>
                  {all && <td className="px-4 py-3">{t.nyito}</td>}
                  <td className="px-4 py-3 text-steel num">{formatDateTime(t.created_at)}</td>
                  <td className="px-4 py-3">{t.status === 'nyitott' ? <Pill tone="blue">Nyitott</Pill> : <Pill>Lezárva</Pill>}</td>
                  <td className="px-4 py-3 text-right">{t.van_atirat && <button type="button" className="btn btn-ghost btn-sm" onClick={() => openTranscript(t)}>Átirat</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
