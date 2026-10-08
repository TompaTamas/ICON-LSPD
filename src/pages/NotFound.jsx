import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="display text-8xl font-extrabold text-gold">404</p>
      <h1 className="display mt-2 text-4xl font-bold">Ez az oldal nincs a nyilvántartásban</h1>
      <p className="mt-3 text-steel">Lehet, hogy elírtad a címet, vagy az oldal megszűnt.</p>
      <Link to="/" className="btn btn-primary mt-6">Vissza a főoldalra</Link>
    </div>
  );
}
