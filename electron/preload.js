const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  history: {
    getHistory: () => ipcRenderer.invoke('history-get'),
    saveHistory: (data) => ipcRenderer.invoke('history-save', data),
  },
  redis: {
    get: (key) => ipcRenderer.invoke('redis-get', key),
    set: (key, value, options) => ipcRenderer.invoke('redis-set', key, value, options),
  },
});
