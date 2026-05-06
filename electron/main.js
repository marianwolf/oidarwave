const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const fs = require('fs');

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
        pages.push({
          route: '/' + basePath,
          file: resolvedPath
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
  const pageRouteNorm = page.route.endsWith('/') ? page.route.slice(0, -1) : page.route;
  const decodedPathname = decodeURIComponent(pathname);
  const normalizedPathname = decodedPathname.endsWith('/') ? decodedPathname.slice(0, -1) : decodedPathname;
  
  // Exact match on route
  if (normalizedPathname === pageRouteNorm || normalizedPathname === pageRouteNorm + '/index.html') {
    return true;
  }
  
  // Match on file path
  const pageFileNorm = page.file.replace(/\\/g, '/');
  const pageFileDir = pageFileNorm.replace(/\/index\.html$/, '');
  const pathWithoutLeadingSlash = normalizedPathname.startsWith('/') ? normalizedPathname.slice(1) : normalizedPathname;
  
  if (
    normalizedPathname === pageFileNorm || 
    pathWithoutLeadingSlash === pageFileNorm ||
    normalizedPathname === pageFileDir ||
    pathWithoutLeadingSlash === pageFileDir
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
      webSecurity: true
    },
    icon: path.join(__dirname, '..', 'favicon/favicon.svg')
  });

  const appDir = path.resolve(path.join(__dirname, '..'));
  
  if (!cachedAvailablePages) {
    cachedAvailablePages = await discoverPages(appDir, '', appDir);
    // Add root page
    cachedAvailablePages.unshift({ route: '/', file: path.join(appDir, 'index.html') });
  }
  
  const availablePages = cachedAvailablePages;

  function setupWindow(win) {
    function tryLoadSubpage(url) {
      try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;

        for (const page of availablePages) {
          if (matchesRoute(pathname, page)) {
            win.loadFile(page.file);
            return true;
          }
        }
      } catch (err) {
        console.error('Not a valid URL', err);
      }
      return false;
    }

    win.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('oidarwave://')) {
        event.preventDefault();
        const route = url.replace('oidarwave://', '').replace(/^\/+/, '');
        tryLoadSubpage('file:///' + route);
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        event.preventDefault();
        electron.shell.openExternal(url);
      } else if (!url.startsWith('mailto:')) {
        event.preventDefault();
        if (!tryLoadSubpage(url)) {
          win.loadFile(path.join(appDir, 'index.html'));
        }
      }
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const { shell } = require('electron');
        shell.openExternal(url);
      } else if (url.startsWith('file://') || url.startsWith('oidarwave://')) {
        const newWin = new BrowserWindow({
          width: 1200,
          height: 800,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
          },
          icon: path.join(__dirname, '..', 'favicon/favicon.svg')
        });
        setupWindow(newWin);
        
        try {
          let targetUrl = url;
          if (url.startsWith('oidarwave://')) {
            const route = url.replace('oidarwave://', '').replace(/^\/+/, '');
            targetUrl = 'file:///' + route;
          }
          const pathname = new URL(targetUrl).pathname;
          let loaded = false;
          for (const page of availablePages) {
            if (matchesRoute(pathname, page)) {
              newWin.loadFile(page.file);
              loaded = true;
              break;
            }
          }
          if (!loaded) newWin.loadFile(path.join(appDir, 'index.html'));
        } catch (err) {
          newWin.loadFile(path.join(appDir, 'index.html'));
        }
      }
      return { action: 'deny' };
    });
  }

  setupWindow(mainWindow);
  mainWindow.loadFile(path.join(appDir, 'index.html'));
}
app.whenReady().then(async () => {
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