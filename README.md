# ICON LSPD – weboldal

Az ICON LSPD hivatalos oldala: Büntető Törvénykönyv bírság-kalkulátorral, élő szolgálati tábla, Szabályzat, MDT, időpontfoglalás. Az adatokat az ICON LSPD Discord bot API-ja szolgáltatja; belépés Discorddal.

- Minden `main` ágra küldött módosítás után a GitHub Actions automatikusan buildeli és kiteszi az oldalt a GitHub Pages-re.
- A bot API címét a repó **Settings → Secrets and variables → Actions → Variables** alatt, a `VITE_API_URL` változóban kell megadni (HTTPS).
- Helyi futtatás: `npm install`, majd `npm run dev`.
