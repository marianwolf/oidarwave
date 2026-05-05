const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const fs = require('fs');

// Dynamically discover all available HTML subpages
function discoverPages(dir, basePath = '') {
  const pages = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const routePath = path.join(basePath, item.name);
      
      if (item.isDirectory()) {
        const indexPath = path.join(fullPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          pages.push({
            route: '/' + basePath + (basePath ? '/' : '') + item.name,
            file: indexPath
          });
        }
        pages.push(...discoverPages(fullPath, routePath));
      } else if (item.isFile() && item.name === 'index.html' && basePath && !basePath.includes('electron')) {
        pages.push({
          route: '/' + basePath,
          file: fullPath
        });
      }
    }
  } catch (err) {
    console.error('Error discovering pages:', err);
  }
  return pages;
}

function createWindow() {
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

  const appDir = path.join(__dirname, '..');
  const availablePages = discoverPages(appDir);
  // Add root page
  availablePages.unshift({ route: '/', file: path.join(appDir, 'index.html') });

  function tryLoadSubpage(url) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
      
      for (const page of availablePages) {
        const pageRouteNorm = page.route.endsWith('/') ? page.route.slice(0, -1) : page.route;
        if (normalizedPath === pageRouteNorm || pathname === page.route || pathname === page.route + '/' || 
            pathname.endsWith('/' + path.basename(page.file))) {
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
      tryLoadSubpage('file://' + route) || tryLoadSubpage('oidarwave://' + route);
    } else if (!url.startsWith('http') && !url.startsWith('mailto:')) {
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

app.whenReady().then(() => {
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