import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { api, devLoginUrl, loginUrl } from '../lib/api.js';
import { Loading, Logo } from '../components/ui.jsx';

const ERRORS = {
  'nem-tag': 'A Discord-fiókod nem tagja az ICON LSPD szervernek. Csatlakozz a szerverhez, majd lépj be újra.',
  sikertelen: 'Nem sikerült a belépés. Próbáld újra.',
  megszakitva: 'Megszakítottad a belépést a Discordon.',
};

/** Ide tér vissza a Discord-belépés: elmenti a tokent, majd visszavisz az eredeti oldalra. */
export default function Login() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);
  const [invite, setInvite] = useState(null);
  const token = params.get('token');
  const error = params.get('hiba');
  const vissza = params.get('vissza') || '/';

  useEffect(() => {
    if (!token || handled.current) return;
    handled.current = true;
    login(token).then(() => navigate(vissza, { replace: true }));
  }, [token, login, navigate, vissza]);

  useEffect(() => {
    if (error === 'nem-tag') api('/api/public/info').then((i) => setInvite(i.discordMeghivo)).catch(() => {});
  }, [error]);

  if (token) return <Loading text="Belépés…" />;

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div className="mb-6 flex justify-center"><Logo size={72} /></div>
      <h1 className="display text-5xl font-extrabold">Belépés</h1>
      {error && <p className="mt-4 rounded-md bg-siren-red/5 px-4 py-3 text-siren-red">{ERRORS[error] ?? ERRORS.sikertelen}</p>}
      {error === 'nem-tag' && invite && <a href={invite} className="btn btn-gold mt-4" target="_blank" rel="noreferrer">Csatlakozás az ICON LSPD Discordhoz</a>}

      {params.get('fejlesztoi') ? (
        <div className="mt-8 rounded-xl border border-dashed border-warn/50 bg-warn/5 p-6 text-left">
          <h2 className="font-bold">Fejlesztői belépés (offline mód)</h2>
          <p className="mt-1 text-sm text-steel">A bot Discord nélkül fut, ezért egy kitalált taggal léphetsz be. Élesben ez nem jelenik meg.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[['vezeto', 'Vezető (Chief Of Police)'], ['felugyelo', 'Felügyelő (Sergeant I)'], ['lspd', 'Officer (Police Officer II)'], ['tag', 'Civil szervertag']].map(([szint, label]) => (
              <a key={szint} href={devLoginUrl(szint, vissza)} className="btn btn-ghost">{label}</a>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-steel">A Discord-fiókoddal lépsz be. Csak a nevedet és az avatarodat kérjük el; a rangjaidat a bot ellenőrzi az ICON LSPD szerveren.</p>
          <a href={loginUrl(vissza)} className="btn btn-primary mt-6">Belépés Discorddal</a>
        </>
      )}
      <p className="mt-8 text-sm"><Link to="/" className="text-uniform underline">Vissza a főoldalra</Link></p>
    </div>
  );
}
