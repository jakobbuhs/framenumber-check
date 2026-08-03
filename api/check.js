// Reference serverless endpoint (Vercel-style) for a PRIVACY-PRESERVING lookup.
//
// Why this exists:
//   The static client (index.html + script.js) fetches frames.json in the
//   browser, which means the ENTIRE list is downloadable by anyone. If the
//   frame numbers are sensitive business/inventory data, that is a leak.
//
//   This endpoint keeps the data server-side and returns ONLY a boolean, so
//   the client never receives the full list. It cannot run on GitHub Pages
//   (static hosting) — deploy it on Vercel, Netlify Functions, or a
//   Cloudflare Worker, and have the client POST the typed number to it.
//
// To actually protect the data you must also move frames.json OUT of the
// public web root (e.g. read it from a private store or an env-configured
// path), not serve it from this repository's root.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeFrameNumber } from "../frame-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let frameSetPromise = null;
async function getFrameSet() {
  if (!frameSetPromise) {
    frameSetPromise = readFile(join(__dirname, "..", "frames.json"), "utf-8")
      .then((raw) => new Set(Object.keys(JSON.parse(raw).frames || {})));
  }
  return frameSetPromise;
}

// Extremely small in-memory rate limiter (per warm instance). For production,
// use a shared store (KV/Redis) so limits hold across instances.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map();
function rateLimited(key) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate_limited" });
    return;
  }

  const sn = normalizeFrameNumber(req.body && req.body.frameNumber);
  if (!sn) {
    res.status(400).json({ error: "missing_frame_number" });
    return;
  }

  const set = await getFrameSet();
  let found = set.has(sn);
  if (!found && /^\d+$/.test(sn)) {
    const stripped = sn.replace(/^0+/, "");
    found = Boolean(stripped) && set.has(stripped);
  }

  // Only a boolean leaves the server — never the list or any record details.
  res.status(200).json({ found });
}
