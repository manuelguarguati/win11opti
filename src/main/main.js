'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RES = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', '..');
const ENGINE = path.join(RES, 'engine', 'engine.ps1');
const DATA = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Win11Opti');

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')); } catch { return null; } };
const catalog = readJson(path.join(RES, 'catalog', 'tweaks.json')) || { tweaks: [], profiles: {} };
const appsCatalog = readJson(path.join(RES, 'catalog', 'apps.json')) || { apps: [] };
const IDS = new Set(catalog.tweaks.map((t) => t.id));
const APP_IDS = new Set(appsCatalog.apps.map((a) => a.id));

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const getSettings = () => Object.assign({ lang: 'en', updates: true }, readJson(settingsFile()));
const snapshot = () => ({ state: readJson(path.join(DATA, 'state.json')), auto: readJson(path.join(DATA, 'auto.json')) });

const validIds = (a) => Array.isArray(a) && a.length > 0 && a.every((i) => IDS.has(i));
const validGame = (g) => typeof g === 'string' && /^[A-Za-z0-9 ._-]{1,64}\.exe$/.test(g);
const validAppIds = (arr) => Array.isArray(arr) && arr.length > 0 && arr.every((id) => APP_IDS.has(id));

// Runs the engine elevated (UAC prompt). All arguments are validated before reaching here.
function runEngine(args) {
  return new Promise((resolve) => {
    const inner = `-NoProfile -ExecutionPolicy Bypass -File "${ENGINE}" ${args}`.replace(/'/g, "''");
    const cmd = `$p = Start-Process powershell.exe -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList '${inner}'; exit $p.ExitCode`;
    const c = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true });
    c.on('close', (code) => resolve(code === 0));
    c.on('error', () => resolve(false));
  });
}

function listInstalledApps() {
  return new Promise((resolve) => {
    const cmd = `(Get-AppxPackage | Select-Object -ExpandProperty Name) -join ','`;
    const c = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true });
    let out = '';
    c.stdout.on('data', (d) => { out += d.toString(); });
    c.on('close', () => {
      const list = out.trim().split(',').map((s) => s.trim()).filter(Boolean);
      resolve(list);
    });
    c.on('error', () => resolve([]));
  });
}

const readEngineLog = () => {
  const logPath = path.join(DATA, 'engine.log');
  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split(/\r?\n/).slice(-100);
      return lines.join('\n');
    }
  } catch {}
  return '';
};

ipcMain.handle('init', () => ({
  catalog,
  appsCatalog,
  ...snapshot(),
  settings: getSettings(),
  version: app.getVersion(),
}));

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

ipcMain.handle('apps:list-installed', async () => await listInstalledApps());

ipcMain.handle('apps:remove', async (_e, appIds) => {
  if (!validAppIds(appIds)) return { ok: false, error: 'Invalid app selection' };
  const ok = await runEngine(`-Action RemoveApps -AppIds "${appIds.join(',')}"`);
  return { ok };
});

ipcMain.handle('system:restart-explorer', async () => {
  const ok = await runEngine('-Action RestartExplorer');
  return { ok };
});

ipcMain.handle('system:restore-point', async () => {
  const ok = await runEngine('-Action CreateRestorePoint');
  return { ok };
});

ipcMain.handle('system:read-log', () => readEngineLog());

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
    width: 1140,
    height: 760,
    minWidth: 980,
    minHeight: 660,
    backgroundColor: '#0d0f17',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0d0f17', symbolColor: '#cbd5e1', height: 36 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (app.isPackaged && getSettings().updates) {
    try { require('electron-updater').autoUpdater.checkForUpdatesAndNotify(); } catch { /* offline: ignore */ }
  }
});

app.on('window-all-closed', () => app.quit());
