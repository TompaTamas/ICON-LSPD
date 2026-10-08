import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { loginUrl } from '../lib/api.js';
import { Loading, Logo } from './ui.jsx';

const LEVEL_TEXT = {
  tag: 'Ezt az oldalt az ICON LSPD Discord szerver tagjai láthatják.',
  lspd: 'Ezt az oldalt csak LSPD-rangú tagok láthatják.',
  felugyelo: 'Ezt az oldalt csak felügyelők láthatják.',
  vezeto: 'Ezt az oldalt csak a vezetőség láthatja.',
};

/** Csak a megadott szinttől jeleníti meg a tartalmat; különben belépésre vagy magyarázatra vált. */
export default function Guard({ level = 'tag', children }) {
  const { user, status, can, problem } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Loading />;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mb-6 flex justify-center"><Logo size={72} /></div>
        <h1 className="display text-4xl font-extrabold">Lépj be a folytatáshoz</h1>
        <p className="mt-3 text-steel">
          {problem === 'nem-tag'
            ? 'A Discord-fiókod nem tagja az ICON LSPD szervernek. Csatlakozz, majd lépj be újra.'
            : problem === 'lejart'
              ? 'A belépésed lejárt. Lépj be újra a Discord-fiókoddal.'
              : LEVEL_TEXT[level]}
        </p>
        <a href={loginUrl(location.pathname)} className="btn btn-primary mt-6">Belépés Discorddal</a>
      </div>
    );
  }
  if (!can(level)) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="display text-4xl font-extrabold">Nincs hozzáférésed</h1>
        <p className="mt-3 text-steel">{LEVEL_TEXT[level]} Ha szerinted ez hiba, nyiss ticketet a Discordon.</p>
      </div>
    );
  }
  return children;
}
