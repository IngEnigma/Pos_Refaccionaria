const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const { registerWindowIpc } = require('./ipc/window.ipc');

const DEV_SERVER_URL = 'http://localhost:4200';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_ROOT = path.join(PROJECT_ROOT, 'dist');
const NPM_LIFECYCLE_EVENT = process.env.npm_lifecycle_event ?? '';
const isProduction = app.isPackaged || NPM_LIFECYCLE_EVENT === 'electron:prod';

function isTrustedNavigation(urlToCheck) {
  try {
    if (isProduction) {
      return urlToCheck.startsWith('file://');
    }

    const trustedOrigin = new URL(DEV_SERVER_URL).origin;
    const targetOrigin = new URL(urlToCheck).origin;
    return targetOrigin === trustedOrigin;
  } catch {
    return false;
  }
}

function resolveAngularIndexHtmlPath() {
  const candidates = [];
  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageName = String(packageJson.name ?? '').trim();
    if (packageName) {
      candidates.push(path.join(DIST_ROOT, packageName, 'browser', 'index.html'));
      candidates.push(path.join(DIST_ROOT, packageName, 'index.html'));
    }
  }

  if (fs.existsSync(DIST_ROOT)) {
    const distEntries = fs
      .readdirSync(DIST_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const entryName of distEntries) {
      candidates.push(path.join(DIST_ROOT, entryName, 'browser', 'index.html'));
      candidates.push(path.join(DIST_ROOT, entryName, 'index.html'));
    }
  }

  const normalizedCandidates = [...new Set(candidates)];
  const indexPath = normalizedCandidates.find((candidatePath) =>
    fs.existsSync(candidatePath),
  );

  if (!indexPath) {
    throw new Error(
      `No se encontró index.html de Angular en dist. Ejecuta "npm run build:prod" antes de "npm run electron:prod".`,
    );
  }

  return indexPath;
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, urlToCheck) => {
    if (!isTrustedNavigation(urlToCheck)) {
      event.preventDefault();
    }
  });

  if (isProduction) {
    const indexHtmlPath = resolveAngularIndexHtmlPath();
    void mainWindow.loadFile(indexHtmlPath);
    return mainWindow;
  }

  void mainWindow.loadURL(DEV_SERVER_URL);
  return mainWindow;
}

app.whenReady().then(() => {
  registerWindowIpc();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
