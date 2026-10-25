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
});
