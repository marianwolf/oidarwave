const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  history: {
    getHistory: () => ipcRenderer.invoke('history-get'),
    saveHistory: (data) => ipcRenderer.invoke('history-save', data),
  }
});