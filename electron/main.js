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
  // Match exact route or route with trailing slash
  if (pathname === pageRouteNorm || pathname === page.route || pathname === page.route + '/') {
    return true;
  }
  // For index.html files, also match when pathname is route + '/index.html'
  if (pathname === page.route + '/index.html') {
    return true;
  }
  return false;
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    icon: path.join(__dirname, '..', 'favicon.svg')
  });

  const appDir = path.resolve(path.join(__dirname, '..'));
  const availablePages = await discoverPages(appDir, '', appDir);
  // Add root page
  availablePages.unshift({ route: '/', file: path.join(appDir, 'index.html') });

  function tryLoadSubpage(url) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

      for (const page of availablePages) {
        if (matchesRoute(normalizedPath, page)) {
          mainWindow.loadFile(page.file);
          return true;
        }
      }
    } catch (err) {
      console.error('Not a valid URL', err);
    }
    return false;
  }

  mainWindow.loadFile(path.join(appDir, 'index.html'));

   // Handle custom oidarwave:// protocol for in-app navigation
   mainWindow.webContents.on('will-navigate', (event, url) => {
     if (url.startsWith('oidarwave://')) {
       event.preventDefault();
       const route = url.replace('oidarwave://', '');
       const loaded = tryLoadSubpage('file:///' + route);
       if (!loaded) {
         tryLoadSubpage('oidarwave:///' + route);
       }
     } else if (url.startsWith('http://') || url.startsWith('https://')) {
       event.preventDefault();
       const { shell } = require('electron');
       shell.openExternal(url);
     } else if (!url.startsWith('mailto:')) {
       event.preventDefault();
       if (!tryLoadSubpage(url)) {
         // Unknown route - stay on current page or load root
         mainWindow.loadFile(path.join(appDir, 'index.html'));
       }
     }
   });

  // Handle window.open for external links (keep default behavior for http/https)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });
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