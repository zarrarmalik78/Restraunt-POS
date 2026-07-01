const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkLicense: () => ipcRenderer.invoke('check-license'),
  zoomIn: () => webFrame.setZoomLevel(webFrame.getZoomLevel() + 0.5),
  zoomOut: () => webFrame.setZoomLevel(webFrame.getZoomLevel() - 0.5),
  resetZoom: () => webFrame.setZoomLevel(0)
});
