import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);
const ORDER = ['tag', 'lspd', 'vezeto'];

/** Megfelel-e a felhasználó a szintnek ('tag' | 'lspd' | 'felugyelo' | 'vezeto'). */
export function meets(user, level) {
  if (!user) return false;
  if (level === 'felugyelo') return !!user.felugyelo;
  return ORDER.indexOf(user.szint) >= ORDER.indexOf(level);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? 'loading' : 'guest');
  const [problem, setProblem] = useState(null);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setStatus('guest');
      return;
    }
    setStatus('loading');
    try {
      setUser(await api('/api/me'));
      setProblem(null);
      setStatus('ready');
    } catch (err) {
      if (err.status === 401 || err.status === 403) setToken(null);
      setUser(null);
      setProblem(err.code === 'NEM_TAG' ? 'nem-tag' : err.status === 401 ? 'lejart' : 'hiba');
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      status,
      problem,
      refresh,
      login(token) {
        setToken(token);
        return refresh();
      },
      logout() {
        setToken(null);
        setUser(null);
        setStatus('guest');
      },
      can: (level) => meets(user, level),
    }),
    [user, status, problem, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
