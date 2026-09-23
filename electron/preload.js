const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

  printTest: () => ipcRenderer.invoke('printer:test'),

  generateTicket: (ticket) =>
    ipcRenderer.invoke('printer:generate-ticket', ticket),
});
