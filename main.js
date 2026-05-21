const { app, BrowserWindow, globalShortcut, session, ipcMain } = require("electron");
const log = require('electron-log');
const path = require("path");
const fs = require('fs');
const url = require("url");

function getAppBasePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked');
  }

  return __dirname;
}

function getAssetPath(...segments) {
  return path.join(getAppBasePath(), 'dist', 'browser', 'assets', ...segments);
}

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

let win;
function createWindow() {
  log.initialize();

  log.info('Electron Log initialized successfully...');

  log.errorHandler.startCatching({
    showDialog: false,
    onError({ createIssue, error, processType, versions }) {
      if (processType === 'renderer') {
        return;
      }

      win.webContents.send('app-error', {
        eventTypeDescription: 'Application: Unhandled Error',
        data2: error.message,
        remarks: error.stack,
        data1: error.name
      });

      electron.dialog.showMessageBox({
        title: 'An error occurred',
        message: error.message,
        detail: error.stack,
        type: 'error',
        buttons: ['Ignore', 'Report', 'Exit'],
      })
      // could be used to automatically create an issue on github
      // see: https://github.com/megahertz/electron-log/blob/master/docs/catch.md
      // .then((result) => {
      //   if (result.response === 1) {
      //     createIssue('https://github.com/visualengineers/reflex-layers/issues/new', {
      //       title: `Error report for ${versions.app}`,
      //       body: 'Error:\n```' + error.stack + '\n```\n' + `OS: ${versions.os}`
      //     });
      //     return;
      //   }

      //   if (result.response === 2) {
      //     electron.app.quit();
      //   }
      // });
    }
  });

  session.defaultSession.clearCache();
  session.defaultSession.clearStorageData();

  win = new BrowserWindow({
    width: 800, height: 600,
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    // needed to access IPC in the electronIpcService
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
  } });
  // load the dist folder from Angular
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, '/dist/browser/index.html'), // compiled version of our app
      protocol: "file:",
      slashes: true
    })
  );

  win.webContents.send('app-ready');

  // uncomment for debugging purposes
  // win.webContents.openDevTools();

  win.webContents.on('did-fail-load', () => win.loadURL(
    url.format({
      pathname: path.join(__dirname, '/dist/browser/index.html'), // compiled version of our app
      protocol: "file:",
      slashes: true
    })
  ));

  win.fullScreen = true;

  // Register event listeners for the window status
  win.on('focus', () => {
    win.webContents.send('window-activated', { data1: 'focus' });
  });

  win.on('blur', () => {
    win.webContents.send('window-deactivated', { data1: 'blur' });
  });

  win.on('minimize', () => {
    win.webContents.send('window-deactivated', { data1: 'minimize' });
  });

  win.on('restore', () => {
    win.webContents.send('window-activated', { data1: 'restore' });
  });

  win.on('show', () => {
    win.webContents.send('window-activated', { data1: 'show' });
  });

  win.on('hide', () => {
    win.webContents.send('window-deactivated', { data1: 'hide' });
  });

  return win;
}

app.on("ready", async () => {
  createWindow();

  globalShortcut.register('Esc', () => {
    // don't quit immediately, but send a message to the renderer process
     win.webContents.send('app-closing', { data1: 'Escape' });
  });
  globalShortcut.register('F12', () => {
    win.webContents.openDevTools();
  });

});

// on macOS, closing the window doesn't quit the app

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on('save-settings', (event, settings) => {
  const settingsFile = getAssetPath('data', 'settings.json');
  fs.writeFile(settingsFile, settings,
    () => {
      console.info('Successfully saved configuration: ' + settings),
      log.info('Successfully saved configuration: ' + settings)
    }
  );
});

ipcMain.on('app-closing-complete', () => {
  // quit after sending diag request
  app.quit();
});
