const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const fs = require('fs');
const { createClient } = require('redis');

let redisClient = null;

async function initRedis() {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redisClient.connect();
    console.log('Redis connected');
  } catch (e) {
    console.error('Redis connection failed:', e.message);
    redisClient = null;
  }
}

const HISTORY_KEY = 'station_history';

async function loadHistoryFromRedis() {
  try {
    if (!redisClient) return null;
    const data = await redisClient.get(HISTORY_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load history from Redis:', e);
  }
  return null;
}

async function saveHistoryToRedis(data) {
  try {
    if (!redisClient) return false;
    await redisClient.set(HISTORY_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save history to Redis:', e);
    return false;
  }
}

// Dynamically discover all available HTML subpages
async function discoverPages(dir, basePath = '', appDir) {
  const pages = [];
  try {
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const resolvedPath = path.resolve(fullPath);
      if (item.isSymbolicLink()) continue;
      if (!resolvedPath.startsWith(appDir)) continue;
      const routePath = path.join(basePath, item.name).replace(/\\/g, '/');

      if (item.isDirectory()) {
        pages.push(...await discoverPages(resolvedPath, routePath, appDir));
      } else if (item.isFile() && item.name === 'index.html' && basePath && !basePath.includes('electron')) {
        const route = '/' + basePath;
        const file = resolvedPath;
        const pageRouteNorm = route.endsWith('/') ? route.slice(0, -1) : route;
        const pageFileNorm = file.replace(/\\/g, '/');
        const pageFileDir = pageFileNorm.replace(/\/index\.html$/, '');
        pages.push({
          route,
          file,
          pageRouteNorm,
          pageFileNorm,
          pageFileDir
        });
      }
    }
  } catch (err) {
    console.error('Error discovering pages:', err);
    return [];
  }
  return pages;
}

function matchesRoute(pathname, page) {
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    decodedPathname = pathname;
  }
  const normalizedPathname = decodedPathname.endsWith('/') ? decodedPathname.slice(0, -1) : decodedPathname;
  
  // Exact match on route
  if (normalizedPathname === page.pageRouteNorm || normalizedPathname === page.pageRouteNorm + '/index.html') {
    return true;
  }
  
  // Match on file path
  const pathWithoutLeadingSlash = normalizedPathname.startsWith('/') ? normalizedPathname.slice(1) : normalizedPathname;
  
  if (
    normalizedPathname === page.pageFileNorm || 
    pathWithoutLeadingSlash === page.pageFileNorm ||
    normalizedPathname === page.pageFileDir ||
    pathWithoutLeadingSlash === page.pageFileDir
  ) {
    return true;
  }
  
  return false;
}

let cachedAvailablePages = null;

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'favicon/favicon.svg')
  });

  const appDir = path.resolve(path.join(__dirname, '..'));
  
  if (!cachedAvailablePages) {
    cachedAvailablePages = await discoverPages(appDir, '', appDir);
    // Add root page
    const route = '/';
    const file = path.join(appDir, 'index.html');
    const pageRouteNorm = route.endsWith('/') ? route.slice(0, -1) : route;
    const pageFileNorm = file.replace(/\\/g, '/');
    const pageFileDir = pageFileNorm.replace(/\/index\.html$/, '');
    cachedAvailablePages.unshift({ route, file, pageRouteNorm, pageFileNorm, pageFileDir });
  }
  
  const availablePages = cachedAvailablePages;

  function tryLoadSubpage(targetWin, url) {
    let targetUrl = url;
    if (url.startsWith('oidarwave://')) {
      const route = url.replace('oidarwave://', '').replace(/^\/+/, '');
      targetUrl = 'file:///' + route;
    }
    try {
      const parsedUrl = new URL(targetUrl);
      const pathname = parsedUrl.pathname;

      for (const page of availablePages) {
        if (matchesRoute(pathname, page)) {
          targetWin.loadFile(page.file);
          return true;
        }
      }
    } catch (err) {
      console.error('Not a valid URL', err);
    }
    return false;
  }

  function setupWindow(win) {
    win.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        event.preventDefault();
        electron.shell.openExternal(url);
      } else if (!url.startsWith('mailto:')) {
        event.preventDefault();
        if (!tryLoadSubpage(win, url)) {
          win.loadFile(path.join(appDir, 'index.html'));
        }
      }
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        electron.shell.openExternal(url);
      } else if (url.startsWith('file://') || url.startsWith('oidarwave://')) {
        const newWin = new BrowserWindow({
          width: 1200,
          height: 800,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js')
          },
          icon: path.join(__dirname, '..', 'favicon/favicon.svg')
        });
        setupWindow(newWin);
        
        if (!tryLoadSubpage(newWin, url)) {
          newWin.loadFile(path.join(appDir, 'index.html'));
        }
      }
      return { action: 'deny' };
    });
  }

  setupWindow(mainWindow);
  mainWindow.loadFile(path.join(appDir, 'index.html'));
}

// IPC Handlers
electron.ipcMain.handle('history-get', async () => {
  const redisData = await loadHistoryFromRedis();
  return redisData;
});

electron.ipcMain.handle('history-save', async (event, data) => {
  const saved = await saveHistoryToRedis(data);
  // Also save to localStorage via return (renderer will handle it)
  return { redis: saved };
});

app.whenReady().then(async () => {
  await initRedis();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});