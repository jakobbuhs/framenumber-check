// Client-side lookup.
// NOTE: this version fetches frames.json in the browser, so the full list is
// technically downloadable by anyone. To keep the list private, deploy the
// serverless boolean API described in README.md (see api/check.js).

import { lookupFrame } from "./frame-utils.js";

let frames = null;      // mapping SN -> info
let frameSet = null;    // Set of SN strings
let meta = null;

// Optional contact details. Leave empty to render contact guidance without a
// broken mailto link; set your address to enable the "Kontakt oss" button.
const CONTACT_EMAIL = "";
const CONTACT_LINK_TEXT = "Kontakt oss";

function lookup(snRaw) {
  const out = lookupFrame(snRaw, frameSet);
  if (out.state === "hit") {
    out.info = frames[out.sn];
    if (out.viaLeadingZeroStrip) {
      out.note = "Treff etter fjerning av ledende nuller.";
    }
  }
  return out;
}

function setResultHTML(html, cssClass) {
  const el = document.getElementById("result");
  el.classList.remove("ok","no","loading");
  el.classList.add(cssClass);
  el.innerHTML = html;
}

function contactCTA() {
  const safeEmail = CONTACT_EMAIL.trim();
  const contactControl = safeEmail.includes("@")
    ? `<a class="tag" href="mailto:${encodeURIComponent(safeEmail)}">${CONTACT_LINK_TEXT}</a>`
    : `<span class="tag">${CONTACT_LINK_TEXT}</span>`;
  return `
    <div class="cta">
      ${contactControl}
      <button type="button" class="tag as-link" id="reset-btn">Sjekk et annet nummer</button>
    </div>
  `;
}

async function init() {
  try {
    const res = await fetch("./frames.json", { cache: "no-store" });
    const data = await res.json();
    frames = data.frames || {};
    frameSet = new Set(Object.keys(frames));
    meta = data.meta || {};
    document.getElementById("meta").textContent =
      `Listen inneholder ${meta.count ?? frameSet.size} rammenumre (oppdatert fra fil: ${meta.source_file ?? "frames.json"}, datoer: ${meta.date_range?.min ?? "?"} til ${meta.date_range?.max ?? "?"}).`;
    setResultHTML(`<span class="tag">Klar</span><p>Skriv inn et rammenummer og trykk <b>Sjekk</b>.</p>`, "loading");
  } catch (e) {
    setResultHTML(`<span class="tag">Feil</span><p>Kunne ikke laste listen. Vennligst prøv igjen senere.</p>`, "no");
    console.error(e);
  }
}

function onCheck() {
  const val = document.getElementById("sn").value;
  const out = lookup(val);

  if (out.state === "empty") {
    setResultHTML(`<span class="tag">Mangler</span><p>Vennligst skriv inn et rammenummer.</p>`, "loading");
    return;
  }

  if (out.state === "hit") {
    const info = out.info || {};
    const details = `
      <div class="kvs">
        ${info.description ? `<div class="kv"><b>Modell</b>: ${escapeHtml(info.description)}</div>` : ""}
        ${info.code ? `<div class="kv"><b>Kode</b>: ${escapeHtml(info.code)}</div>` : ""}
        <div class="kv"><b>Rammenummer</b>: ${escapeHtml(out.sn)}</div>
      </div>
    `;
    setResultHTML(
      `<span class="tag">Funnet</span>
       <p><b>Rammenummeret ditt er på listen.</b> Vennligst kontakt oss slik at vi kan hjelpe deg videre.</p>
       ${out.note ? `<p class="tiny">${escapeHtml(out.note)}</p>` : ""}
       ${details}
       ${contactCTA()}`,
      "ok"
    );
    return;
  }

  setResultHTML(
    `<span class="tag">Ikke funnet</span>
     <p>Vi fant ikke det rammenummeret i den gjeldende listen.</p>
     <p class="tiny">Hvis du tror dette er en feil, ta gjerne kontakt likevel.</p>
     ${contactCTA()}`,
    "no"
  );
}

function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

document.getElementById("btn").addEventListener("click", onCheck);
document.getElementById("sn").addEventListener("keydown", (e) => {
  if (e.key === "Enter") onCheck();
});

// Delegated handler for the dynamically-rendered "check another number" button.
document.getElementById("result").addEventListener("click", (e) => {
  if (e.target && e.target.id === "reset-btn") {
    const input = document.getElementById("sn");
    input.value = "";
    input.focus();
    setResultHTML(
      `<span class="tag">Klar</span><p>Skriv inn et rammenummer og trykk <b>Sjekk</b>.</p>`,
      "loading"
    );
  }
});

init();
