'use strict';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined && txt !== null) e.textContent = txt;
  return e;
};

let D = null;
let lang = 'en';
let activeTab = 'tweaks';
let pickedTweaks = new Set();
let pickedApps = new Set();
let installedApps = new Set();
let selectedCatFilter = 'all';
let tweakSearchTerm = '';
let appSearchTerm = '';
let onlyInstalledApps = true;
let timer = null;

const S = () => window.STRINGS[lang] || window.STRINGS.en;
const T = (o) => (o && (o[lang] || o.en)) || '';

function showToast(msg, duration = 3500) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  setTimeout(() => { t.hidden = true; }, duration);
}

// TAB NAVIGATION
function setupTabs() {
  document.querySelectorAll('.nav-tab').forEach((tabBtn) => {
    tabBtn.onclick = () => {
      document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach((v) => v.classList.remove('active'));

      tabBtn.classList.add('active');
      activeTab = tabBtn.dataset.tab;
      const targetView = $(`view-${activeTab}`);
      if (targetView) targetView.classList.add('active');

      if (activeTab === 'tools') loadLogs();
    };
  });
}

// TAB 1: TWEAKS & PROFILES
function renderProfiles() {
  const box = $('profiles');
  box.replaceChildren();
  if (!D.catalog || !D.catalog.profiles) return;

  for (const [key, p] of Object.entries(D.catalog.profiles)) {
    const chip = el('button', 'chip');
    chip.textContent = T(p.name);
    chip.onclick = () => {
      pickedTweaks = new Set(p.tweaks);
      document.querySelectorAll('.profiles-chips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderTweaksList();
      updateSummary();
    };
    box.append(chip);
  }
}

function renderCategoryFilters() {
  const container = $('catFilters');
  container.replaceChildren();

  const allBtn = el('button', 'cat-pill' + (selectedCatFilter === 'all' ? ' active' : ''), S().allCats);
  allBtn.onclick = () => { selectedCatFilter = 'all'; renderCategoryFilters(); renderTweaksList(); };
  container.append(allBtn);

  for (const [catKey, catName] of Object.entries(S().cat)) {
    const pill = el('button', 'cat-pill' + (selectedCatFilter === catKey ? ' active' : ''), catName);
    pill.onclick = () => { selectedCatFilter = catKey; renderCategoryFilters(); renderTweaksList(); };
    container.append(pill);
  }
}

function renderTweaksList() {
  const container = $('list');
  container.replaceChildren();
  if (!D.catalog || !D.catalog.tweaks) return;

  const query = tweakSearchTerm.toLowerCase().trim();
  const filtered = D.catalog.tweaks.filter((t) => {
    if (selectedCatFilter !== 'all' && t.category !== selectedCatFilter) return false;
    if (query) {
      const name = T(t.name).toLowerCase();
      const desc = T(t.description).toLowerCase();
      const id = t.id.toLowerCase();
      return name.includes(query) || desc.includes(query) || id.includes(query);
    }
    return true;
  });

  $('tweakCountBadge').textContent = `${filtered.length} / ${D.catalog.tweaks.length}`;

  const cats = selectedCatFilter === 'all' ? Object.keys(S().cat) : [selectedCatFilter];

  for (const cat of cats) {
    const inCat = filtered.filter((t) => t.category === cat);
    if (!inCat.length) continue;

    if (selectedCatFilter === 'all') {
      container.append(el('div', 'cat-group-title', S().cat[cat] || cat));
    }

    for (const t of inCat) {
      const isPicked = pickedTweaks.has(t.id);
      const card = el('div', 'tweak-card' + (isPicked ? ' active' : ''));

      // Switch
      const sw = el('label', 'switch');
      const input = el('input');
      input.type = 'checkbox';
      input.checked = isPicked;
      input.onchange = (e) => {
        e.stopPropagation();
        input.checked ? pickedTweaks.add(t.id) : pickedTweaks.delete(t.id);
        card.classList.toggle('active', input.checked);
        updateSummary();
      };
      const slider = el('span', 'slider');
      sw.append(input, slider);

      // Info
      const info = el('div', 'tweak-info');
      const titleRow = el('div', 'tweak-title-row');
      titleRow.append(
        el('span', 'tweak-name', T(t.name)),
        el('span', `badge ${t.risk}`, S()[t.risk])
      );
      info.append(titleRow, el('p', 'tweak-desc', T(t.description)));

      if (t.warning) {
        info.append(el('div', 'tweak-warning-box', `⚠️ ${T(t.warning)}`));
      }

      card.onclick = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.classList.contains('slider')) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change'));
      };

      card.append(sw, info);
      container.append(card);
    }
  }
}

function updateSummary() {
  const count = pickedTweaks.size;
  $('selCount').textContent = S().sel(count);
  $('go').disabled = count === 0;

  const chosen = (D.catalog?.tweaks || []).filter((t) => pickedTweaks.has(t.id));
  const safeCount = chosen.filter((t) => t.risk === 'safe').length;
  const modCount = chosen.filter((t) => t.risk === 'moderate').length;
  const advCount = chosen.filter((t) => t.risk === 'advanced').length;

  const rb = $('riskBreakdown');
  rb.replaceChildren();
  if (count > 0) {
    if (safeCount) rb.append(el('span', 'badge safe', `${safeCount} ${S().safe}`));
    if (modCount) rb.append(el('span', 'badge moderate', `${modCount} ${S().moderate}`));
    if (advCount) rb.append(el('span', 'badge advanced', `${advCount} ${S().advanced}`));
  }
}

function renderHours() {
  const sel = $('hours');
  sel.replaceChildren();
  const o0 = el('option', null, S().until);
  o0.value = 0;
  sel.append(o0);
  for (const h of [1, 2, 3, 5, 8, 12]) {
    const o = el('option', null, S().hours(h));
    o.value = h;
    sel.append(o);
  }
  sel.value = 3;
}

// TAB 2: APP DEBLOATER
async function refreshInstalledApps() {
  $('txtRefreshApps').textContent = S().busy;
  try {
    const appsList = await window.api.listInstalledApps();
    installedApps = new Set(appsList || []);
  } catch (err) {
    console.error('Error listing installed apps:', err);
  }
  $('txtRefreshApps').textContent = S().scanApps;
  renderAppsList();
}

function renderAppsList() {
  const container = $('appsList');
  container.replaceChildren();
  if (!D.appsCatalog || !D.appsCatalog.apps) return;

  const query = appSearchTerm.toLowerCase().trim();
  const filtered = D.appsCatalog.apps.filter((a) => {
    const isInstalled = isAppInstalled(a.id);
    if (onlyInstalledApps && !isInstalled) return false;
    if (query) {
      const name = (a.name || '').toLowerCase();
      const desc = T(a.description).toLowerCase();
      const id = a.id.toLowerCase();
      return name.includes(query) || desc.includes(query) || id.includes(query);
    }
    return true;
  });

  $('appsCountBadge').textContent = `${pickedApps.size} selected`;
  $('btnUninstallApps').textContent = S().uninstallBtn(pickedApps.size);
  $('btnUninstallApps').disabled = pickedApps.size === 0;

  for (const a of filtered) {
    const isInstalled = isAppInstalled(a.id);
    const isSelected = pickedApps.has(a.id);

    const card = el('div', 'app-card' + (isSelected ? ' selected' : ''));

    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = isSelected;
    cb.onchange = () => {
      cb.checked ? pickedApps.add(a.id) : pickedApps.delete(a.id);
      card.classList.toggle('selected', cb.checked);
      $('appsCountBadge').textContent = `${pickedApps.size} selected`;
      $('btnUninstallApps').textContent = S().uninstallBtn(pickedApps.size);
      $('btnUninstallApps').disabled = pickedApps.size === 0;
    };

    const details = el('div', 'app-details');
    const headerRow = el('div', 'app-header-row');
    headerRow.append(
      el('span', 'app-name', a.name),
      el('span', 'status-badge ' + (isInstalled ? 'installed' : 'not-installed'), isInstalled ? S().installed : S().notInstalled)
    );

    details.append(
      headerRow,
      el('span', 'mu', a.id),
      el('p', 'mu', T(a.description))
    );

    card.onclick = (e) => {
      if (e.target.tagName === 'INPUT') return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    };

    card.append(cb, details);
    container.append(card);
  }
}

function isAppInstalled(appId) {
  if (installedApps.has(appId)) return true;
  for (const name of installedApps) {
    if (name.toLowerCase().includes(appId.toLowerCase()) || appId.toLowerCase().includes(name.toLowerCase())) {
      return true;
    }
  }
  return false;
}

// TAB 4: SYSTEM TOOLS & LOGS
async function loadLogs() {
  const out = $('logOutput');
  try {
    const log = await window.api.readLog();
    out.textContent = log || S().noLogs;
    out.scrollTop = out.scrollHeight;
  } catch {
    out.textContent = S().noLogs;
  }
}

// STATE & COUNTDOWN RING
function renderState() {
  const st = D.state;
  const on = !!st;
  $('vSel').hidden = on;
  $('vAct').hidden = !on;
  clearInterval(timer);
  if (!on) return;

  $('aTitle').textContent = S().active;
  $('rs').textContent = S().restore;

  const appliedIds = st.applied || [];
  $('done').replaceChildren(
    ...appliedIds.map((id) => {
      const t = D.catalog?.tweaks?.find((x) => x.id === id);
      const li = el('li');
      li.append(el('i', null, '✓'), document.createTextNode(t ? T(t.name) : id));
      return li;
    })
  );

  const end = st.end ? new Date(st.end) : null;
  const total = end ? end - new Date(st.start) : 0;
  $('cdl').textContent = end ? S().left : S().manual;

  const tick = () => {
    if (!end) {
      $('cd').textContent = '∞';
      $('arc').style.strokeDashoffset = 0;
      return;
    }
    const r = Math.max(0, end - Date.now());
    const x = Math.floor(r / 1000);
    $('cd').textContent = `${Math.floor(x / 3600)}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
    $('arc').style.strokeDashoffset = 415 * (1 - Math.min(1, r / total));
    if (r <= 0) setTimeout(refresh, 15000);
  };

  tick();
  timer = setInterval(tick, 1000);
}

// BILINGUAL STATIC TEXT
function renderText() {
  const s = S();
  document.documentElement.lang = lang;

  // Header
  $('tagline').textContent = s.tagline;
  $('verBadge').textContent = `v${D.version}`;
  $('ver').textContent = `${s.ver} ${D.version}`;
  $('tabTweaks').textContent = s.tabTweaks;
  $('tabDebloat').textContent = s.tabDebloat;
  $('tabAuto').textContent = s.tabAuto;
  $('tabTools').textContent = s.tabTools;

  // Tweaks tab
  $('tProfiles').textContent = s.profiles;
  $('btnSelectSafe').textContent = s.selectSafe;
  $('btnSelectNone').textContent = s.selectNone;
  $('tweakSearch').placeholder = s.searchTweaks;

  // Debloat tab
  $('debloatHeading').textContent = s.tabDebloat;
  $('debloatDesc').textContent = 'Safely remove pre-installed Windows 11 UWP bloatware and sponsored apps.';
  $('txtRefreshApps').textContent = s.scanApps;
  $('appSearch').placeholder = s.searchApps;
  $('txtOnlyInstalled').textContent = s.onlyInstalled;
  $('btnSelectRecApps').textContent = s.selectRecApps;
  $('btnSelectNoneApps').textContent = s.selectNone;

  // Auto tab
  $('autoHeading').textContent = s.auto;
  $('autoDesc').textContent = s.autoHelp;
  $('lblGames').textContent = 'Game / Program Executable Names (comma-separated):';
  $('btnAutoStart').textContent = s.autoOn;
  $('btnAutoStop').textContent = s.autoOff;

  // Tools tab
  $('tCreateRp').textContent = s.createRp;
  $('btnDoRestorePoint').textContent = s.createRp;
  $('tRestartExp').textContent = s.restartExp;
  $('btnDoRestartExp').textContent = s.restartExp;
  $('tLogHeader').textContent = s.logTitle;
  $('btnRefreshLog').textContent = s.refreshLog;

  // Aside
  $('tDur').textContent = s.dur;
  $('go').textContent = s.go;
  $('tUpd').textContent = s.upd;

  // Modal
  $('mT').textContent = s.warnT;
  $('mC').textContent = s.warnC;
  $('mNo').textContent = s.cancel;
  $('mYes').textContent = s.cont;

  renderCategoryFilters();
  renderProfiles();
  renderHours();
  renderTweaksList();
  renderAppsList();
  updateSummary();
  renderState();
}

async function refresh() {
  Object.assign(D, await window.api.snapshot());
  renderState();
}

// RISK WARNING MODAL
function confirmRisk(tweaks) {
  const risky = tweaks.filter((t) => t.risk !== 'safe' || t.warning);
  if (!risky.length) return Promise.resolve(true);

  $('mIntro').textContent = 'Some of the tweaks you selected modify system-level policies or services. Please review them:';
  $('mL').replaceChildren(
    ...risky.map((t) => {
      const li = el('li');
      li.append(el('b', null, `${T(t.name)}: `), document.createTextNode(T(t.warning) || T(t.description)));
      return li;
    })
  );

  $('mOk').checked = false;
  $('mYes').disabled = true;
  $('modal').hidden = false;

  return new Promise((resolve) => {
    const finish = (accepted) => {
      $('modal').hidden = true;
      resolve(accepted);
    };
    $('mNo').onclick = () => finish(false);
    $('mYes').onclick = () => finish(true);
  });
}

// DEBLOAT APPS CONFIRMATION MODAL
function confirmUninstallApps(appsToUninstall) {
  $('mIntro').textContent = S().uninstallConfirmMsg;
  $('mL').replaceChildren(
    ...appsToUninstall.map((a) => {
      const li = el('li');
      li.append(el('b', null, `${a.name} `), el('span', 'mu', `(${a.id})`));
      return li;
    })
  );

  $('mOk').checked = false;
  $('mYes').disabled = true;
  $('modal').hidden = false;

  return new Promise((resolve) => {
    const finish = (accepted) => {
      $('modal').hidden = true;
      resolve(accepted);
    };
    $('mNo').onclick = () => finish(false);
    $('mYes').onclick = () => finish(true);
  });
}

// INITIALIZATION & EVENT LISTENERS
window.addEventListener('DOMContentLoaded', async () => {
  setupTabs();

  D = await window.api.init();
  lang = D.settings?.lang || 'en';
  $('lang').value = lang;
  $('upd').checked = D.settings?.updates !== false;

  // Fetch installed apps in background
  refreshInstalledApps();

  renderText();

  // Search tweaks
  $('tweakSearch').oninput = (e) => {
    tweakSearchTerm = e.target.value;
    $('clearTweakSearch').hidden = !tweakSearchTerm;
    renderTweaksList();
  };
  $('clearTweakSearch').onclick = () => {
    $('tweakSearch').value = '';
    tweakSearchTerm = '';
    $('clearTweakSearch').hidden = true;
    renderTweaksList();
  };

  // Search apps
  $('appSearch').oninput = (e) => {
    appSearchTerm = e.target.value;
    $('clearAppSearch').hidden = !appSearchTerm;
    renderAppsList();
  };
  $('clearAppSearch').onclick = () => {
    $('appSearch').value = '';
    appSearchTerm = '';
    $('clearAppSearch').hidden = true;
    renderAppsList();
  };

  $('chkOnlyInstalled').onchange = (e) => {
    onlyInstalledApps = e.target.checked;
    renderAppsList();
  };

  $('btnRefreshApps').onclick = () => refreshInstalledApps();

  // Quick buttons: Tweaks
  $('btnSelectSafe').onclick = () => {
    for (const t of D.catalog.tweaks) {
      if (t.risk === 'safe') pickedTweaks.add(t.id);
    }
    renderTweaksList();
    updateSummary();
  };

  $('btnSelectNone').onclick = () => {
    pickedTweaks.clear();
    document.querySelectorAll('.profiles-chips .chip').forEach((c) => c.classList.remove('active'));
    renderTweaksList();
    updateSummary();
  };

  // Quick buttons: Apps
  $('btnSelectRecApps').onclick = () => {
    pickedApps.clear();
    for (const a of D.appsCatalog.apps) {
      if (a.recommended && isAppInstalled(a.id)) {
        pickedApps.add(a.id);
      }
    }
    renderAppsList();
  };

  $('btnSelectNoneApps').onclick = () => {
    pickedApps.clear();
    renderAppsList();
  };

  // Apply Tweaks
  $('go').onclick = async () => {
    const chosen = D.catalog.tweaks.filter((t) => pickedTweaks.has(t.id));
    if (!(await confirmRisk(chosen))) return;

    $('go').disabled = true;
    $('go').textContent = S().busy;

    const r = await window.api.apply([...pickedTweaks], Number($('hours').value));
    if (!r.ok) {
      alert(S().err);
    } else {
      showToast('Optimization applied successfully!');
    }
    D.state = r.state;
    D.auto = r.auto;
    $('go').disabled = false;
    $('go').textContent = S().go;
    renderState();
  };

  // Restore Defaults
  $('rs').onclick = async () => {
    $('rs').disabled = true;
    $('rs').textContent = S().busy;

    const r = await window.api.revert();
    if (!r.ok) {
      alert(S().err);
    } else {
      showToast('Settings restored back to normal.');
    }
    D.state = r.state;
    D.auto = r.auto;
    $('rs').disabled = false;
    renderState();
  };

  // Uninstall Apps
  $('btnUninstallApps').onclick = async () => {
    const selectedAppsList = D.appsCatalog.apps.filter((a) => pickedApps.has(a.id));
    if (!(await confirmUninstallApps(selectedAppsList))) return;

    $('btnUninstallApps').disabled = true;
    $('btnUninstallApps').textContent = S().uninstalling;

    const res = await window.api.removeApps([...pickedApps]);
    if (res.ok) {
      showToast(S().uninstallSuccess);
      pickedApps.clear();
      await refreshInstalledApps();
    } else {
      alert(S().err);
    }
    $('btnUninstallApps').disabled = false;
    $('btnUninstallApps').textContent = S().uninstallBtn(pickedApps.size);
  };

  // Auto Mode
  $('btnAutoStart').onclick = async () => {
    const games = $('gamesInput').value.split(',').map((g) => g.trim()).filter(Boolean);
    const chosen = D.catalog.tweaks.filter((t) => pickedTweaks.has(t.id));
    if (!games.length || !chosen.length || !(await confirmRisk(chosen))) return;

    $('btnAutoStart').disabled = true;
    $('btnAutoStart').textContent = S().busy;
    const r = await window.api.autoSet(games, [...pickedTweaks]);
    if (r.ok) {
      showToast('Auto mode enabled for games!');
      D.auto = r.auto;
    } else {
      alert(S().err);
    }
    $('btnAutoStart').disabled = false;
    $('btnAutoStart').textContent = S().autoOn;
  };

  $('btnAutoStop').onclick = async () => {
    await window.api.autoClear();
    showToast('Auto mode disabled.');
  };

  // Tools: Restore point
  $('btnDoRestorePoint').onclick = async () => {
    $('btnDoRestorePoint').disabled = true;
    $('btnDoRestorePoint').textContent = S().creatingRp;
    const res = await window.api.createRestorePoint();
    if (res.ok) {
      showToast(S().rpSuccess);
    } else {
      alert(S().rpFail);
    }
    $('btnDoRestorePoint').disabled = false;
    $('btnDoRestorePoint').textContent = S().createRp;
    loadLogs();
  };

  // Tools: Restart explorer
  $('btnDoRestartExp').onclick = async () => {
    $('btnDoRestartExp').disabled = true;
    $('btnDoRestartExp').textContent = S().restartingExp;
    const res = await window.api.restartExplorer();
    if (res.ok) {
      showToast(S().expDone);
    }
    $('btnDoRestartExp').disabled = false;
    $('btnDoRestartExp').textContent = S().restartExp;
    loadLogs();
  };

  $('btnRefreshLog').onclick = () => loadLogs();

  // Modal agree checkbox
  $('mOk').onchange = (e) => {
    $('mYes').disabled = !e.target.checked;
  };

  // Settings
  $('lang').onchange = async (e) => {
    lang = e.target.value;
    await window.api.setSettings({ lang });
    renderText();
  };

  $('upd').onchange = (e) => {
    window.api.setSettings({ updates: e.target.checked });
  };
});
