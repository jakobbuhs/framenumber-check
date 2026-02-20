// Enkel sjekk på klientsiden.
// MERK: Dette laster frames.json i nettleseren. Hvis du vil holde listen privat,
// bruk "serverless-alternativet" i README.md.

let frames = null;      // mapping SN -> info
let frameSet = null;    // Set of SN strings
let meta = null;

const CONTACT_EMAIL = "REPLACE_ME@example.com"; // <-- change this
const CONTACT_LINK_TEXT = "Kontakt oss";

function normalize(raw) {
  if (!raw) return "";
  // Keep only letters+digits (so users can paste labels/spaces)
  const parts = raw.toString().trim().match(/[A-Za-z0-9]+/g);
  if (!parts) return "";
  return parts.join("").toUpperCase();
}

function lookup(snRaw) {
  const sn = normalize(snRaw);
  if (!sn) return { state: "empty" };

  // Exact match
  if (frameSet.has(sn)) return { state: "hit", sn, info: frames[sn] };

  // If all digits, also try stripping leading zeros
  if (/^\d+$/.test(sn)) {
    const stripped = sn.replace(/^0+/, "");
    if (stripped && frameSet.has(stripped)) return { state: "hit", sn: stripped, info: frames[stripped], note: `Treff etter fjerning av ledende nuller (du skrev inn ${sn}).` };
  }

  return { state: "miss", sn };
}

function setResultHTML(html, cssClass) {
  const el = document.getElementById("result");
  el.classList.remove("ok","no","loading");
  el.classList.add(cssClass);
  el.innerHTML = html;
}

function contactCTA() {
  const safeEmail = CONTACT_EMAIL.trim();
  const mailto = safeEmail.includes("@") ? `mailto:${encodeURIComponent(safeEmail)}` : "#";
  return `
    <div class="cta">
      <a class="tag" href="${mailto}">${CONTACT_LINK_TEXT}</a>
      <a class="tag" href="#" onclick="window.location.reload(); return false;">Sjekk et annet nummer</a>
    </div>
    <div class="tiny">
      Admin: sett din kontakt-e-post i <code>script.js</code> (CONTACT_EMAIL).
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

init();
