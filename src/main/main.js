'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RES = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', '..');
const ENGINE = path.join(RES, 'engine', 'engine.ps1');
const DATA = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Win11Opti');
const catalog = JSON.parse(fs.readFileSync(path.join(RES, 'catalog', 'tweaks.json'), 'utf8'));
const IDS = new Set(catalog.tweaks.map((t) => t.id));

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')); } catch { return null; } };
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const getSettings = () => Object.assign({ lang: 'en', updates: true }, readJson(settingsFile()));
const snapshot = () => ({ state: readJson(path.join(DATA, 'state.json')), auto: readJson(path.join(DATA, 'auto.json')) });

const validIds = (a) => Array.isArray(a) && a.length > 0 && a.every((i) => IDS.has(i));
const validGame = (g) => typeof g === 'string' && /^[A-Za-z0-9 ._-]{1,64}\.exe$/.test(g);

// Runs the engine elevated (UAC prompt). All arguments are validated above; nothing user-typed reaches the shell raw.
function runEngine(args) {
  return new Promise((resolve) => {
    const inner = `-NoProfile -ExecutionPolicy Bypass -File "${ENGINE}" ${args}`.replace(/'/g, "''");
    const cmd = `$p = Start-Process powershell.exe -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList '${inner}'; exit $p.ExitCode`;
    const c = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true });
    c.on('close', (code) => resolve(code === 0));
    c.on('error', () => resolve(false));
  });
}

ipcMain.handle('init', () => ({ catalog, ...snapshot(), settings: getSettings(), version: app.getVersion() }));
ipcMain.handle('snapshot', () => snapshot());
ipcMain.handle('apply', async (_e, ids, hours) => {
  if (!validIds(ids)) return { ok: false, ...snapshot() };
  const h = Math.min(24, Math.max(0, Number(hours) || 0));
  const ok = await runEngine(`-Action Apply -Ids ${ids.join(',')} -Hours ${h}`);
  return { ok, ...snapshot() };
});
ipcMain.handle('revert', async () => ({ ok: await runEngine('-Action Revert'), ...snapshot() }));
ipcMain.handle('auto:set', async (_e, games, ids) => {
  if (!validIds(ids) || !Array.isArray(games) || !games.length || !games.every(validGame)) return { ok: false, ...snapshot() };
  return { ok: await runEngine(`-Action SetAuto -Games "${games.join(',')}" -Ids ${ids.join(',')}`), ...snapshot() };
});
ipcMain.handle('auto:clear', async () => ({ ok: await runEngine('-Action ClearAuto'), ...snapshot() }));
ipcMain.handle('settings:set', (_e, patch) => {
  const s = getSettings();
  if (patch && ['en', 'es'].includes(patch.lang)) s.lang = patch.lang;
  if (patch && typeof patch.updates === 'boolean') s.updates = patch.updates;
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(s));
  return s;
});

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1080, height: 720, minWidth: 940, minHeight: 620, backgroundColor: '#0d0f17', autoHideMenuBar: true,
    titleBarStyle: 'hidden', titleBarOverlay: { color: '#0d0f17', symbolColor: '#cbd5e1', height: 36 },
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // The ONLY network request this app makes: checking GitHub Releases for a new version (can be turned off).
  if (app.isPackaged && getSettings().updates) {
    try { require('electron-updater').autoUpdater.checkForUpdatesAndNotify(); } catch { /* offline: ignore */ }
  }
});
app.on('window-all-closed', () => app.quit());
