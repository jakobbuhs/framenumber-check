// Simple client-side checker.
// NOTE: This loads frames.json in the browser. If you want to keep the list private,
// use the "serverless option" in README.md.

let frames = null;      // mapping SN -> info
let frameSet = null;    // Set of SN strings
let meta = null;

const CONTACT_EMAIL = "REPLACE_ME@example.com"; // <-- change this
const CONTACT_LINK_TEXT = "Contact us";

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
    if (stripped && frameSet.has(stripped)) return { state: "hit", sn: stripped, info: frames[stripped], note: `Matched after removing leading zeros (you entered ${sn}).` };
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
      <a class="tag" href="#" onclick="window.location.reload(); return false;">Check another number</a>
    </div>
    <div class="tiny">
      Admin: set your contact email in <code>script.js</code> (CONTACT_EMAIL).
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
      `List contains ${meta.count ?? frameSet.size} frame numbers (updated from file: ${meta.source_file ?? "frames.json"}, dates: ${meta.date_range?.min ?? "?"} to ${meta.date_range?.max ?? "?"}).`;
    setResultHTML(`<span class="tag">Ready</span><p>Enter a frame number and press <b>Check</b>.</p>`, "loading");
  } catch (e) {
    setResultHTML(`<span class="tag">Error</span><p>Could not load the list. Please try again later.</p>`, "no");
    console.error(e);
  }
}

function onCheck() {
  const val = document.getElementById("sn").value;
  const out = lookup(val);

  if (out.state === "empty") {
    setResultHTML(`<span class="tag">Missing</span><p>Please enter a frame number.</p>`, "loading");
    return;
  }

  if (out.state === "hit") {
    const info = out.info || {};
    const details = `
      <div class="kvs">
        ${info.description ? `<div class="kv"><b>Model</b>: ${escapeHtml(info.description)}</div>` : ""}
        ${info.code ? `<div class="kv"><b>Code</b>: ${escapeHtml(info.code)}</div>` : ""}
        <div class="kv"><b>Frame number</b>: ${escapeHtml(out.sn)}</div>
      </div>
    `;
    setResultHTML(
      `<span class="tag">Found</span>
       <p><b>Your frame number appears on the list.</b> Please contact us so we can help you with next steps.</p>
       ${out.note ? `<p class="tiny">${escapeHtml(out.note)}</p>` : ""}
       ${details}
       ${contactCTA()}`,
      "ok"
    );
    return;
  }

  setResultHTML(
    `<span class="tag">Not found</span>
     <p>We couldn’t find that frame number in the current list.</p>
     <p class="tiny">If you think this is a mistake, please reach out anyway.</p>
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
