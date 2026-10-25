'use strict';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
let D, lang = 'en', picked = new Set(), timer;
const S = () => window.STRINGS[lang];
const T = (o) => (o && (o[lang] || o.en)) || '';

function renderList() {
  const box = $('list'); box.replaceChildren();
  for (const cat of Object.keys(S().cat)) {
    const items = D.catalog.tweaks.filter((t) => t.category === cat); if (!items.length) continue;
    box.append(el('h4', null, S().cat[cat]));
    for (const t of items) {
      const row = el('label', 'row' + (picked.has(t.id) ? ' on' : ''));
      const cb = el('input'); cb.type = 'checkbox'; cb.checked = picked.has(t.id);
      cb.onchange = () => { cb.checked ? picked.add(t.id) : picked.delete(t.id); renderList(); };
      const info = el('div'); info.append(el('b', null, T(t.name)), el('p', 'mu', T(t.description)));
      row.append(cb, info, el('span', 'badge ' + t.risk, S()[t.risk]));
      box.append(row);
    }
  }
  $('selCount').textContent = S().sel(picked.size); $('go').disabled = picked.size === 0;
}
function renderProfiles() {
  const box = $('profiles'); box.replaceChildren(el('h4', null, S().profiles));
  for (const [k, p] of Object.entries(D.catalog.profiles)) {
    const b = el('button', 'chip', T(p.name)); b.onclick = () => { picked = new Set(p.tweaks); renderList(); }; box.append(b);
  }
}
function renderHours() {
  const sel = $('hours'); sel.replaceChildren();
  const o0 = el('option', null, S().until); o0.value = 0; sel.append(o0);
  for (const h of [1, 2, 3, 5, 8, 12]) { const o = el('option', null, S().hours(h)); o.value = h; sel.append(o); }
  sel.value = 3;
}
function renderState() {
  const st = D.state, on = !!st;
  $('vSel').hidden = on; $('vAct').hidden = !on; clearInterval(timer); if (!on) return;
  $('aTitle').textContent = S().active; $('rs').textContent = S().restore; $('autoOff').textContent = S().autoOff; $('autoOff').hidden = !D.auto;
  $('done').replaceChildren(...(st.applied || []).map((id) => { const t = D.catalog.tweaks.find((x) => x.id === id); const li = el('li'); li.append(el('i', null, '✓'), document.createTextNode(t ? T(t.name) : id)); return li; }));
  const end = st.end ? new Date(st.end) : null, total = end ? end - new Date(st.start) : 0; $('cdl').textContent = end ? S().left : S().manual;
  const tick = () => {
    if (!end) { $('cd').textContent = '∞'; $('arc').style.strokeDashoffset = 0; return; }
    const r = Math.max(0, end - Date.now()), x = Math.floor(r / 1000);
    $('cd').textContent = `${Math.floor(x / 3600)}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
    $('arc').style.strokeDashoffset = 415 * (1 - Math.min(1, r / total));
    if (r <= 0) setTimeout(refresh, 15000);
  };
  tick(); timer = setInterval(tick, 1000);
}
function renderText() {
  const s = S(); document.documentElement.lang = lang; $('tagline').textContent = s.tagline; $('tDur').textContent = s.dur; $('go').textContent = s.go;
  $('tAuto').textContent = s.auto; $('autoHelp').textContent = s.autoHelp; $('autoOn').textContent = s.autoOn; $('tUpd').textContent = s.upd;
  $('ver').textContent = `${s.ver} ${D.version}`; $('mT').textContent = s.warnT; $('mC').textContent = s.warnC; $('mNo').textContent = s.cancel; $('mYes').textContent = s.cont;
  renderProfiles(); renderHours(); renderList(); renderState();
}
async function refresh() { Object.assign(D, await window.api.snapshot()); renderState(); }
function confirmRisk(tweaks) {
  const risky = tweaks.filter((t) => t.risk !== 'safe' || t.warning); if (!risky.length) return Promise.resolve(true);
  $('mL').replaceChildren(...risky.map((t) => { const li = el('li'); li.append(el('b', null, T(t.name) + ': '), document.createTextNode(T(t.warning) || T(t.description))); return li; }));
  $('mOk').checked = false; $('mYes').disabled = true; $('modal').hidden = false;
  return new Promise((res) => { const done = (v) => { $('modal').hidden = true; res(v); }; $('mNo').onclick = () => done(false); $('mYes').onclick = () => done(true); });
}
async function act(btn, label, fn) {
  btn.disabled = true; btn.textContent = S().busy; const r = await fn();
  if (!r.ok) alert(S().err); D.state = r.state; D.auto = r.auto; btn.disabled = false; btn.textContent = label; renderState();
}
$('mOk').onchange = (e) => { $('mYes').disabled = !e.target.checked; };
$('lang').onchange = async (e) => { lang = e.target.value; await window.api.setSettings({ lang }); renderText(); };
$('upd').onchange = (e) => window.api.setSettings({ updates: e.target.checked });
$('go').onclick = async () => {
  const chosen = D.catalog.tweaks.filter((t) => picked.has(t.id)); if (!(await confirmRisk(chosen))) return;
  act($('go'), S().go, () => window.api.apply([...picked], Number($('hours').value)));
};
$('rs').onclick = () => act($('rs'), S().restore, () => window.api.revert());
$('autoOn').onclick = async () => {
  const games = $('games').value.split(',').map((g) => g.trim()).filter(Boolean); const chosen = D.catalog.tweaks.filter((t) => picked.has(t.id));
  if (!games.length || !chosen.length || !(await confirmRisk(chosen))) return;
  act($('autoOn'), S().autoOn, () => window.api.autoSet(games, [...picked]));
};
$('autoOff').onclick = () => act($('autoOff'), S().autoOff, () => window.api.autoClear());
window.api.init().then((d) => { D = d; lang = d.settings.lang; $('lang').value = lang; $('upd').checked = d.settings.updates; picked = new Set(d.catalog.profiles.gamer.tweaks); renderText(); });
