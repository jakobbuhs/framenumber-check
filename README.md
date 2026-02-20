# 011 Frame Number Checker (Static)

This is a tiny website where customers enter their frame number and the site checks if it's in `frames.json`.

## 1) Customize the contact method
Open `script.js` and change:

- `CONTACT_EMAIL = "REPLACE_ME@example.com"`
- `CONTACT_LINK_TEXT` (optional)

**Important:** this site does **not** show a phone number.

## 2) Deploy for free (easiest)

### Option A — Netlify (drag & drop)
1. Go to Netlify and create a free account.
2. Drag the whole folder contents (`index.html`, `script.js`, `frames.json`) into the Netlify deploy area.
3. You’ll get a public URL like `https://something.netlify.app`.

### Option B — GitHub Pages
1. Create a public GitHub repo.
2. Upload the 3 files to the repo root.
3. Settings → Pages → Deploy from branch → `main` / root.
4. You’ll get `https://YOURNAME.github.io/REPO/`

### Option C — Cloudflare Pages
1. Create a free Cloudflare account.
2. Pages → Create project → Connect to Git or upload assets.
3. Build settings: none (static). Output: `/`.

## Privacy note
This version downloads `frames.json` in the browser, so the list is technically accessible to anyone.

If you want to **hide the list**, use a serverless function (e.g., Cloudflare Worker, Vercel/Netlify function) and only return `found: true/false`.
