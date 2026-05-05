const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');

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

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Dynamically discover all available HTML subpages
  const appDir = path.join(__dirname, '..');
  const availablePages = [];
  
  function discoverPages(dir, basePath = '') {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const routePath = path.join(basePath, item.name);
        
        if (item.isDirectory()) {
          const indexPath = path.join(fullPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            availablePages.push({
              route: '/' + basePath + (basePath ? '/' : '') + item.name,
              file: indexPath
            });
          }
          discoverPages(fullPath, routePath);
        } else if (item.isFile() && item.name === 'index.html' && basePath) {
          // Skip root index.html, only handle subdirectory ones
          availablePages.push({
            route: '/' + basePath,
            file: fullPath
          });
        }
      }
    } catch (err) {
      console.error('Error discovering pages:', err);
    }
  }
  
  const fs = require('fs');
  discoverPages(appDir);

  function tryLoadSubpage(url) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
      
      for (const page of availablePages) {
        const pageRouteNorm = page.route.endsWith('/') ? page.route.slice(0, -1) : page.route;
        if (normalizedPath === pageRouteNorm || pathname === page.route || pathname === page.route + '/' || pathname.endsWith('/' + path.basename(page.file))) {
          mainWindow.loadFile(page.file);
          return true;
        }
      }
    } catch (err) {
      console.error('Error loading subpage:', err);
    }
    return false;
  }

  // Handle navigation to subpages (dynamically discovered)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (tryLoadSubpage(url)) {
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Also handle in-app navigation via navigation links
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (tryLoadSubpage(url)) {
      event.preventDefault();
    }
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