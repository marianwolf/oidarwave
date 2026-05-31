const { app, BrowserWindow, protocol, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath, pathToFileURL } = require('url');

// Directories that should never be scanned during page discovery
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  '.venv',
  '.vscode',
  '.pytest_cache',
  'electron',
  'tests',
  'dist'
]);

// Dynamically discover all available HTML subpages
async function discoverPages(dir, basePath = '', appDir) {
  const pages = [];
  try {
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    
    // Process items in parallel using Promise.all to optimize filesystem I/O
    await Promise.all(
      items.map(async (item) => {
        if (item.isSymbolicLink()) return;

        const fullPath = path.join(dir, item.name);
        const resolvedPath = path.resolve(fullPath);
        if (!resolvedPath.startsWith(appDir)) return;

        const routePath = path.join(basePath, item.name).replace(/\\/g, '/');

        if (item.isDirectory()) {
          if (IGNORED_DIRS.has(item.name)) return;
          const subPages = await discoverPages(resolvedPath, routePath, appDir);
          pages.push(...subPages);
        } else if (item.isFile() && item.name === 'index.html' && basePath) {
          const route = '/' + basePath;
          const pageRouteNorm = route.endsWith('/') ? route.slice(0, -1) : route;
          const pageFileNorm = resolvedPath.replace(/\\/g, '/');
          const pageFileDir = pageFileNorm.replace(/\/index\.html$/, '');
          pages.push({
            route,
            file: resolvedPath,
            pageRouteNorm,
            pageFileNorm,
            pageFileDir
          });
        }
      })
    );
  } catch (err) {
    console.error('Error discovering pages:', err);
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

let availablePagesPromise = null;

// Retrieves and caches the available pages promise to avoid concurrent scans
function getAvailablePages(appDir) {
  if (!availablePagesPromise) {
    availablePagesPromise = (async () => {
      const pages = await discoverPages(appDir, '', appDir);
      // Add root page
      const route = '/';
      const file = path.join(appDir, 'index.html');
      const pageRouteNorm = route.endsWith('/') ? route.slice(0, -1) : route;
      const pageFileNorm = file.replace(/\\/g, '/');
      const pageFileDir = pageFileNorm.replace(/\/index\.html$/, '');
      pages.unshift({ route, file, pageRouteNorm, pageFileNorm, pageFileDir });
      return pages;
    })();
  }
  return availablePagesPromise;
}

async function createWindow() {
  const appDir = path.resolve(path.join(__dirname, '..'));
  const availablePages = await getAvailablePages(appDir);

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Prevent the initial white flash
    backgroundColor: '#0f172a', // Set to --color-bg-base for premium look and feel
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true // Explicitly enable process sandboxing for safety
    },
    icon: path.join(__dirname, '..', 'favicon/favicon.svg')
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

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
    const handleNavigation = (event, url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        event.preventDefault();
        shell.openExternal(url);
      } else if (!url.startsWith('mailto:')) {
        event.preventDefault();
        if (!tryLoadSubpage(win, url)) {
          win.loadFile(path.join(appDir, 'index.html'));
        }
      }
    };

    win.webContents.on('will-navigate', handleNavigation);
    win.webContents.on('will-redirect', handleNavigation); // Prevent redirect bypasses

    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
        shell.openExternal(url);
      } else if (url.startsWith('file://') || url.startsWith('oidarwave://')) {
        const newWin = new BrowserWindow({
          width: 1200,
          height: 800,
          show: false,
          backgroundColor: '#0f172a',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            sandbox: true
          },
          icon: path.join(__dirname, '..', 'favicon/favicon.svg')
        });
        
        newWin.once('ready-to-show', () => {
          newWin.show();
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

app.whenReady().then(async () => {
  // Register or override the 'file' protocol securely
  protocol.handle('file', async (request) => {
    try {
      const parsedUrl = new URL(request.url);
      
      // Strip query parameters and hash fragments to prevent path resolution failure
      parsedUrl.search = '';
      parsedUrl.hash = '';

      const filePath = fileURLToPath(parsedUrl.href);
      const resolvedPath = path.resolve(filePath);
      const appDir = path.resolve(path.join(__dirname, '..'));

      // Check that the resolved path is under the appDir to prevent directory traversal
      if (!resolvedPath.startsWith(appDir)) {
        console.error('Path traversal attempt blocked:', request.url);
        return new Response('Access Denied', { status: 403 });
      }

      const fileUrl = pathToFileURL(resolvedPath).toString();
      return net.fetch(fileUrl, { bypassCustomProtocolHandlers: true });
    } catch (err) {
      console.error('Error handling file request:', err);
      return new Response('Invalid Request', { status: 400 });
    }
  });

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
