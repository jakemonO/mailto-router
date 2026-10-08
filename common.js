// Shared helpers: default providers, storage, mailto parsing, template filling.

const FIELDS = ["to", "cc", "bcc", "subject", "body"];

const DEFAULT_PROVIDERS = [
  {
    id: "aol",
    name: "AOL Mail",
    template: "https://mail.aol.com/d/compose/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"
  },
  {
    id: "gmail",
    name: "Gmail",
    template: "https://mail.google.com/mail/?view=cm&fs=1&to={to}&cc={cc}&bcc={bcc}&su={subject}&body={body}"
  },
  {
    id: "outlook",
    name: "Outlook.com",
    template: "https://outlook.live.com/mail/0/deeplink/compose?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    template: "https://compose.mail.yahoo.com/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"
  }
];

const DEFAULT_SETTINGS = {
  providers: DEFAULT_PROVIDERS,
  defaultId: "aol",
  askEachTime: false
};

async function loadSettings() {
  const stored = await browser.storage.sync.get(DEFAULT_SETTINGS);
  if (!Array.isArray(stored.providers)) stored.providers = DEFAULT_PROVIDERS;
  return stored;
}

function saveSettings(settings) {
  return browser.storage.sync.set(settings);
}

function newId() {
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Lenient percent-decoding: leaves malformed sequences as-is.
function pctDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch (_) {
    return s.replace(/%[0-9a-f]{2}/gi, m => {
      try { return decodeURIComponent(m); } catch (_) { return m; }
    });
  }
}

// Parse a mailto: URI (RFC 6068) into the five standard fields.
// Note: in mailto, "+" is a literal plus, not a space.
function parseMailto(uri) {
  const out = { to: "", cc: "", bcc: "", subject: "", body: "" };
  if (!uri) return out;
  let s = uri.trim().replace(/^mailto:/i, "");
  const hashAt = s.indexOf("#");
  if (hashAt >= 0) s = s.slice(0, hashAt);
  const q = s.indexOf("?");
  const path = q >= 0 ? s.slice(0, q) : s;
  const query = q >= 0 ? s.slice(q + 1) : "";

  const lists = { to: [], cc: [], bcc: [] };
  if (path) lists.to.push(pctDecode(path));
  const bodies = [];

  for (const pair of query.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const key = pctDecode(eq >= 0 ? pair.slice(0, eq) : pair).toLowerCase();
    const val = pctDecode(eq >= 0 ? pair.slice(eq + 1) : "");
    if (key in lists) {
      if (val) lists[key].push(val);
    } else if (key === "subject") {
      if (!out.subject) out.subject = val;
    } else if (key === "body") {
      bodies.push(val);
    }
  }

  const clean = arr => arr.join(",").split(",").map(a => a.trim()).filter(Boolean).join(",");
  out.to = clean(lists.to);
  out.cc = clean(lists.cc);
  out.bcc = clean(lists.bcc);
  out.body = bodies.join("\r\n").replace(/\r?\n/g, "\r\n");
  return out;
}

// Fill a provider template. Placeholders:
//   {to} {cc} {bcc} {subject} {body}   -> percent-encoded value
//   {raw:to} etc.                      -> value inserted unencoded
//   {mailto}                           -> the full original mailto: URI, encoded
// Query parameters whose value ends up empty are dropped, so providers
// don't receive e.g. "cc=" when there is no CC.
function fillTemplate(template, fields, mailtoUri) {
  const filled = template.replace(/\{(raw:)?(to|cc|bcc|subject|body|mailto)\}/gi, (_, raw, name) => {
    name = name.toLowerCase();
    const v = name === "mailto" ? (mailtoUri || "") : (fields[name] || "");
    return raw ? v : encodeURIComponent(v);
  });
  return dropEmptyParams(filled);
}

function dropEmptyParams(url) {
  const qAt = url.indexOf("?");
  if (qAt < 0) return url;
  const hashAt = url.indexOf("#", qAt);
  const base = url.slice(0, qAt);
  const query = hashAt >= 0 ? url.slice(qAt + 1, hashAt) : url.slice(qAt + 1);
  const hash = hashAt >= 0 ? url.slice(hashAt) : "";
  const kept = query.split("&").filter(p => p && !/^[^=]+=$/.test(p));
  return base + (kept.length ? "?" + kept.join("&") : "") + hash;
}
