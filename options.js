let settings;
const $ = id => document.getElementById(id);
let saveTimer;

function flash(msg) {
  $("status").textContent = msg;
  clearTimeout(flash.t);
  flash.t = setTimeout(() => ($("status").textContent = ""), 1500);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await saveSettings(settings);
    flash("Saved");
  }, 300);
  updatePreview();
}

function render() {
  const list = $("list");
  list.textContent = "";
  const tpl = $("rowTpl");
  settings.providers.forEach((p, i) => {
    const row = tpl.content.firstElementChild.cloneNode(true);
    const radio = row.querySelector("input[type=radio]");
    const name = row.querySelector(".name");
    const t = row.querySelector(".tpl");
    radio.checked = p.id === settings.defaultId;
    name.value = p.name;
    t.value = p.template;

    radio.addEventListener("change", () => { settings.defaultId = p.id; scheduleSave(); });
    name.addEventListener("input", () => { p.name = name.value; scheduleSave(); });
    t.addEventListener("input", () => { p.template = t.value.trim(); scheduleSave(); });

    const up = row.querySelector(".up"), down = row.querySelector(".down");
    up.disabled = i === 0;
    down.disabled = i === settings.providers.length - 1;
    up.addEventListener("click", () => move(i, -1));
    down.addEventListener("click", () => move(i, 1));
    row.querySelector(".del").addEventListener("click", () => {
      settings.providers.splice(i, 1);
      if (settings.defaultId === p.id) settings.defaultId = settings.providers[0]?.id || "";
      render(); scheduleSave();
    });
    list.append(row);
  });
  if (!settings.providers.length) {
    list.innerHTML = '<p class="muted" style="margin:0">No providers. Add one below.</p>';
  }
  updatePreview();
}

function move(i, d) {
  const arr = settings.providers;
  [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
  render(); scheduleSave();
}

function defaultProvider() {
  return settings.providers.find(p => p.id === settings.defaultId);
}

function updatePreview() {
  const mailto = $("sample").value.trim();
  $("realLink").href = /^mailto:/i.test(mailto) ? mailto : "mailto:";
  const p = defaultProvider();
  $("preview").textContent = p && p.template
    ? `${p.name || "Default"} → ${fillTemplate(p.template, parseMailto(mailto), mailto)}`
    : "Choose a default provider (the radio button) to preview its URL.";
  $("open").disabled = !(p && p.template);
}

(async () => {
  settings = await loadSettings();
  $("ask").checked = settings.askEachTime;
  render();

  $("ask").addEventListener("change", () => { settings.askEachTime = $("ask").checked; scheduleSave(); });
  $("add").addEventListener("click", () => {
    const p = { id: newId(), name: "", template: "" };
    settings.providers.push(p);
    if (!defaultProvider()) settings.defaultId = p.id;
    render();
    $("list").querySelector(".provider:last-child .name").focus();
    scheduleSave();
  });
  $("reset").addEventListener("click", () => {
    if (!confirm("Replace your provider list with the built-in one?")) return;
    settings.providers = structuredClone(DEFAULT_PROVIDERS);
    settings.defaultId = DEFAULT_SETTINGS.defaultId;
    render(); scheduleSave();
  });
  $("sample").addEventListener("input", updatePreview);
  $("open").addEventListener("click", () => {
    const mailto = $("sample").value.trim();
    const p = defaultProvider();
    if (p) window.open(fillTemplate(p.template, parseMailto(mailto), mailto), "_blank");
  });

  // Keep in sync if the handler page's "remember" changes the default.
  browser.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "sync" || !changes.defaultId) return;
    if (changes.defaultId.newValue === settings.defaultId) return;
    settings = await loadSettings();
    $("ask").checked = settings.askEachTime;
    render();
  });
})();
