const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vpnAPI', {
    connect: (serverConfig) => ipcRenderer.invoke('vpn:connect', serverConfig),
    disconnect: () => ipcRenderer.invoke('vpn:disconnect'),
    getStatus: () => ipcRenderer.invoke('vpn:status'),
    fetchServers: () => ipcRenderer.invoke('vpn:fetch-servers'),
    speedTest: () => ipcRenderer.invoke('vpn:speed-test'),
    getPublicIP: () => ipcRenderer.invoke('vpn:get-ip'),
});

contextBridge.exposeInMainWorld('windowAPI', {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
});
