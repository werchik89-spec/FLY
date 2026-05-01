const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const VPNEngine = require('./vpn/engine');

let mainWindow;
let vpnEngine;

// ─── Auto-elevate to admin on Windows ───
function requestAdminRelaunch() {
    if (process.platform !== 'win32') return false;

    try {
        // Check if already running as admin
        execSync('net session', { stdio: 'ignore', timeout: 3000 });
        return false; // Already admin
    } catch (e) {
        // Not admin — relaunch elevated
        const { shell } = require('electron');
        const appPath = process.argv[0];
        const args = process.argv.slice(1);

        try {
            execSync(`powershell -Command "Start-Process '${appPath}' -ArgumentList '${args.join(' ')}' -Verb RunAs"`, {
                stdio: 'ignore',
                timeout: 10000,
            });
            app.quit();
            return true;
        } catch (err) {
            // User declined UAC — continue without admin (DNS-only mode)
            return false;
        }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    vpnEngine = new VPNEngine();

    mainWindow.on('closed', () => {
        if (vpnEngine) vpnEngine.disconnect();
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    // Try to elevate to admin for full VPN functionality
    if (!requestAdminRelaunch()) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (vpnEngine) vpnEngine.disconnect();
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── IPC Handlers ───

ipcMain.handle('vpn:connect', async (event, serverConfig) => {
    try {
        const result = await vpnEngine.connect(serverConfig);
        return { success: true, ...result };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('vpn:disconnect', async () => {
    try {
        await vpnEngine.disconnect();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('vpn:status', async () => {
    return vpnEngine.getStatus();
});

ipcMain.handle('vpn:fetch-servers', async () => {
    return vpnEngine.fetchServers();
});

ipcMain.handle('vpn:speed-test', async () => {
    return vpnEngine.getSpeedStats();
});

ipcMain.handle('vpn:get-ip', async () => {
    return vpnEngine.getPublicIP();
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});
ipcMain.handle('window:close', () => mainWindow.close());
