const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

const MAC_BINDING_SALT = 'G-TRAX-MAC-BINDING-SALT';

// Check if device is bound to the build
function checkLicense() {
  // Universally authorized for standalone installable app
  return true;
}

// Start the local database server
function startServer() {
  const isDev = !app.isPackaged;
  let serverPath = path.join(__dirname, 'server/index.cjs');
  if (!isDev) {
    serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
  }
  let dataDir = isDev ? path.join(__dirname, 'data') : app.getPath('userData');

  if (!isDev) {
    try {
      const globalConfigPath = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'PizzaHutPOS', 'config.json');
      if (fs.existsSync(globalConfigPath)) {
        const configData = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
        if (configData.dataDir) {
          dataDir = configData.dataDir;
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
        }
      }
    } catch (err) {
      console.error('Failed to read global config for data directory:', err);
    }
  }
  
  // Fork the Node process so it runs concurrently without blocking Electron main process
  serverProcess = fork(serverPath, [], {
    env: { 
      ...process.env, 
      ELECTRON_RUN_AS_NODE: '1',
      PORT: '3001',
      GTRAX_DATA_DIR: dataDir
    }
  });
  
  serverProcess.on('error', (err) => {
    console.error('Failed to start local Express server:', err);
  });
  
  serverProcess.on('exit', (code, signal) => {
    console.log(`Local Express server exited with code ${code} and signal ${signal}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'Pizza Hut POS',
    icon: path.join(__dirname, 'dist', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Remove standard browser menu bar
  mainWindow.removeMenu();

  const isDev = !app.isPackaged;

  if (isDev) {
    // In dev mode, load the Vite dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in dev
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the local Express server
    mainWindow.loadURL('http://localhost:3001');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('check-license', () => {
  return checkLicense();
});

// App lifecycle
app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up background process on exit
app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
