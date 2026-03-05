const { app, BrowserWindow, ipcMain } = require('electron');

let isRegistered = false;

function getSenderWindow(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function registerWindowIpc() {
  if (isRegistered) {
    return;
  }

  ipcMain.on('window:minimize', (event) => {
    const senderWindow = getSenderWindow(event);
    if (!senderWindow || senderWindow.isDestroyed()) {
      return;
    }
    senderWindow.minimize();
  });

  ipcMain.on('window:close', (event) => {
    const senderWindow = getSenderWindow(event);
    if (!senderWindow || senderWindow.isDestroyed()) {
      return;
    }
    senderWindow.close();
  });

  ipcMain.handle('app:getVersion', () => app.getVersion());

  isRegistered = true;
}

module.exports = {
  registerWindowIpc,
};
