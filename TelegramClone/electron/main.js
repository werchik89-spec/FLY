const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow = null;
let serverProcess = null;

function startServer() {
  const serverPath = path.join(__dirname, '..', 'server', 'index.js');
  try {
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: '3001' },
      silent: true,
    });
    serverProcess.stdout?.on('data', (data) => {
      console.log(`Server: ${data}`);
    });
    serverProcess.stderr?.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });
    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../build/icon.png'),
    title: 'ZenvorMs',
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  setTimeout(() => {
    createWindow();
  }, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('close-window', () => mainWindow?.close());
