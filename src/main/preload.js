'use strict';
const { contextBridge, ipcRenderer: ipc } = require('electron');
contextBridge.exposeInMainWorld('api', {
  init: () => ipc.invoke('init'),
  snapshot: () => ipc.invoke('snapshot'),
  apply: (ids, hours) => ipc.invoke('apply', ids, hours),
  revert: () => ipc.invoke('revert'),
  autoSet: (games, ids) => ipc.invoke('auto:set', games, ids),
  autoClear: () => ipc.invoke('auto:clear'),
  setSettings: (p) => ipc.invoke('settings:set', p),
  listInstalledApps: () => ipc.invoke('apps:list-installed'),
  removeApps: (appIds) => ipc.invoke('apps:remove', appIds),
  restartExplorer: () => ipc.invoke('system:restart-explorer'),
  createRestorePoint: () => ipc.invoke('system:restore-point'),
  readLog: () => ipc.invoke('system:read-log'),
});
