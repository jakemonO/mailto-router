(async () => {
  // Firefox substitutes the percent-encoded mailto: URI for %s in "handler.html#%s".
  const raw = location.hash.slice(1);
  let mailto = pctDecode(raw);
  // Some callers double-encode; decode again if it still doesn't look like a mailto.
  if (!/^mailto:/i.test(mailto) && /^mailto%3a/i.test(mailto)) mailto = pctDecode(mailto);

  const fields = parseMailto(mailto);
  const settings = await loadSettings();
  const providers = settings.providers.filter(p => p.template);
  const def = providers.find(p => p.id === settings.defaultId);

  const go = p => location.replace(fillTemplate(p.template, fields, mailto));

  if (def && !settings.askEachTime) {
    go(def);
    return;
  }

  // Chooser
  document.getElementById("app").hidden = false;
  document.getElementById("hint").textContent = providers.length
    ? "Pick the mail service to compose this message in."
    : "No providers are set up yet. Add one in settings.";

  const summary = document.getElementById("summary");
  for (const f of FIELDS) {
    if (!fields[f]) continue;
    const dt = document.createElement("dt");
    dt.textContent = f === "to" ? "To" : f === "cc" ? "Cc" : f === "bcc" ? "Bcc" : f[0].toUpperCase() + f.slice(1);
    const dd = document.createElement("dd");
    dd.textContent = fields[f];
    summary.append(dt, dd);
  }
  if (!summary.children.length) summary.textContent = "(empty message)";

  const remember = document.getElementById("remember");
  const choices = document.getElementById("choices");
  for (const p of providers) {
    const b = document.createElement("button");
    b.textContent = p.name || p.template;
    if (p.id === settings.defaultId) b.classList.add("primary");
    b.addEventListener("click", async () => {
      if (remember.checked) {
        await saveSettings({ defaultId: p.id, askEachTime: false });
      }
      go(p);
    });
    choices.append(b);
  }
})();
