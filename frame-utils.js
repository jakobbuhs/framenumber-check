// Pure, framework-free helpers for frame-number matching.
// Kept dependency-free and DOM-free so they can be unit-tested in Node
// (see test/frame-utils.test.js) and reused by both the browser client
// (script.js) and a serverless endpoint (api/check.js).

/**
 * Normalize a raw user input into a comparable frame number.
 * Keeps only letters and digits (so pasted labels, spaces and symbols are
 * ignored) and upper-cases the result.
 * @param {unknown} raw
 * @returns {string} normalized value, or "" if there is nothing usable
 */
export function normalizeFrameNumber(raw) {
  if (!raw && raw !== 0) return "";
  const parts = raw.toString().trim().match(/[A-Za-z0-9]+/g);
  if (!parts) return "";
  return parts.join("").toUpperCase();
}

/**
 * Look up a raw input against a Set of known (already-normalized) frame numbers.
 * Falls back to a leading-zero-stripped form for all-digit inputs, so that
 * e.g. "0011807" also matches a stored "11807".
 * @param {unknown} raw
 * @param {Set<string>} frameSet
 * @returns {{state:"empty"}|{state:"hit",sn:string,viaLeadingZeroStrip?:boolean}|{state:"miss",sn:string}}
 */
export function lookupFrame(raw, frameSet) {
  const sn = normalizeFrameNumber(raw);
  if (!sn) return { state: "empty" };

  if (frameSet.has(sn)) return { state: "hit", sn };

  if (/^\d+$/.test(sn)) {
    const stripped = sn.replace(/^0+/, "");
    if (stripped && stripped !== sn && frameSet.has(stripped)) {
      return { state: "hit", sn: stripped, viaLeadingZeroStrip: true };
    }
  }

  return { state: "miss", sn };
}
