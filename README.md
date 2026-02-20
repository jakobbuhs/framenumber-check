# 011 Rammenummer-sjekk (Statisk)

Dette er en enkel nettside der kunder skriver inn rammenummeret sitt, og siden sjekker om det finnes i `frames.json`.

## 1) Tilpass kontaktmetoden
Åpne `script.js` og endre:

- `CONTACT_EMAIL = "REPLACE_ME@example.com"`
- `CONTACT_LINK_TEXT` (valgfritt)

**Viktig:** denne siden viser **ikke** et telefonnummer.

## 2) Publiser gratis (enkleste måten)

### Alternativ A — Netlify (dra og slipp)
1. Gå til Netlify og opprett en gratis konto.
2. Dra hele mappeinnholdet (`index.html`, `script.js`, `frames.json`) inn i Netlify sitt publiseringsområde.
3. Du får en offentlig URL som `https://something.netlify.app`.

### Alternativ B — GitHub Pages
1. Opprett et offentlig GitHub-repo.
2. Last opp de 3 filene til roten av repoet.
3. Innstillinger → Pages → Publiser fra gren → `main` / rot.
4. Du får `https://DITTNAVN.github.io/REPO/`

### Alternativ C — Cloudflare Pages
1. Opprett en gratis Cloudflare-konto.
2. Pages → Opprett prosjekt → Koble til Git eller last opp filer.
3. Byggeinnstillinger: ingen (statisk). Utdata: `/`.

## Personvernmerknad
Denne versjonen laster ned `frames.json` i nettleseren, så listen er teknisk sett tilgjengelig for alle.

Hvis du vil **skjule listen**, bruk en serverløs funksjon (f.eks. Cloudflare Worker, Vercel/Netlify-funksjon) og returner bare `found: true/false`.
