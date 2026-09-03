const { app, BrowserWindow, protocol, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath, pathToFileURL } = require('url');
const { ErrorCode, logError, logWarn, initMainProcessErrorHandlers } = require('../src/js/errors.js');
initMainProcessErrorHandlers();

const WINDOW_OPTIONS = {
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
};

// Directories that should never be scanned during page discovery
let ignoredDirsPromise = null;

async function getIgnoredDirs(appDir) {
  if (!ignoredDirsPromise) {
    ignoredDirsPromise = (async () => {
      const defaultIgnored = ['node_modules', '.git', 'dist', 'electron'];
      const ignoreFilePath = path.join(appDir, '.npmignore');
      try {
        const content = await fs.promises.readFile(ignoreFilePath, 'utf8');
        const lines = content
          .split('\\n')
          .map(line => line.trim().replace(/\/$/, ''))
          .filter(line => line && !line.startsWith('#'));
        return new Set([...defaultIgnored, ...lines]);
      } catch (err) {
        if (err.code === 'ENOENT') {
          return new Set(defaultIgnored);
        }
        logError(ErrorCode.NPMIGNORE_READ, err, { path: ignoreFilePath, code: err.code });
        return new Set(defaultIgnored);
      }
    })();
  }
  return ignoredDirsPromise;
}

function buildPageEntry(route, file) {
  const pageRouteNorm = route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route;
  const pageFileNorm = file.replace(/\\/g, '/');
  const pageFileDir = pageFileNorm.replace(/\/index\.html$/, '');
  return { route, file, pageRouteNorm, pageFileNorm, pageFileDir };
}

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
          const ignoredDirs = await getIgnoredDirs(appDir);
          if (ignoredDirs.has(item.name)) return;
          const subPages = await discoverPages(resolvedPath, routePath, appDir);
          pages.push(...subPages);
        } else if (item.isFile() && item.name === 'index.html' && basePath) {
          pages.push(buildPageEntry('/' + basePath, resolvedPath));
        }
      })
    );
  } catch (err) {
    logError(ErrorCode.PAGE_DISCOVERY, err, { dir, basePath, appDir, pagesFound: pages.length });
  }
  return pages;
}

function matchesRoute(pathname, page) {
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (err) {
    logWarn(ErrorCode.PAGE_DISCOVERY, err, { pathname, reason: 'decodeURIComponent' });
    decodedPathname = pathname;
  }
  const normalizedPathname = decodedPathname.length > 1 && decodedPathname.endsWith('/')
    ? decodedPathname.slice(0, -1)
    : decodedPathname;
  const pathnameNoSlash = normalizedPathname.startsWith('/') ? normalizedPathname.slice(1) : normalizedPathname;

  return (
    normalizedPathname === page.pageRouteNorm ||
    normalizedPathname === page.pageRouteNorm + '/index.html' ||
    normalizedPathname === page.pageFileNorm ||
    pathnameNoSlash === page.pageFileNorm ||
    normalizedPathname === page.pageFileDir ||
    pathnameNoSlash === page.pageFileDir
  );
}

let availablePagesPromise = null;

// Retrieves and caches the available pages promise to avoid concurrent scans
function getAvailablePages(appDir) {
  if (!availablePagesPromise) {
    availablePagesPromise = (async () => {
      const pages = await discoverPages(appDir, '', appDir);
      pages.unshift(buildPageEntry('/', path.join(appDir, 'index.html')));
      return pages;
    })();
  }
  return availablePagesPromise;
}

async function createWindow() {
  const appDir = path.resolve(path.join(__dirname, '..'));
  const availablePages = await getAvailablePages(appDir);

  const mainWindow = new BrowserWindow(WINDOW_OPTIONS);

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
      const pathname = new URL(targetUrl).pathname;

      for (const page of availablePages) {
        if (matchesRoute(pathname, page)) {
          targetWin.loadFile(page.file);
          return true;
        }
      }
    } catch (err) {
      logWarn(ErrorCode.INVALID_NAVIGATION_URL, err, { url });
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
        const newWin = new BrowserWindow(WINDOW_OPTIONS);
        newWin.once('ready-to-show', () => newWin.show());
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

      const appDir = path.resolve(path.join(__dirname, '..'));
      let filePath = fileURLToPath(parsedUrl.href);

      // HTML pages use absolute paths (e.g. /src/css/style.css) which resolve to the
      // filesystem root under file://. When the absolute path does not exist on disk,
      // fall back to resolving it relative to the app directory so Electron can serve
      // bundled assets just like a web server would.
      if (!fs.existsSync(filePath) && parsedUrl.pathname.startsWith('/')) {
        const candidatePath = path.join(appDir, parsedUrl.pathname);
        if (fs.existsSync(candidatePath)) {
          filePath = candidatePath;
        }
      }

      const resolvedPath = path.resolve(filePath);

      const relative = path.relative(appDir, resolvedPath);
      const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative);

      // Check that the resolved path is under the appDir to prevent directory traversal
      if (!isSafe) {
        logError(ErrorCode.PATH_TRAVERSAL, null, {
          url: request.url,
          resolvedPath,
          appDir,
          referer: request.headers.get('referer')
        });
        return new Response(JSON.stringify({ code: ErrorCode.PATH_TRAVERSAL, url: request.url }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const fileUrl = pathToFileURL(resolvedPath).toString();
      return net.fetch(fileUrl, { bypassCustomProtocolHandlers: true });
    } catch (err) {
      const errCode = err.code || 'UNKNOWN';
      let status = 500;
      let body = JSON.stringify({ code: ErrorCode.FILE_REQUEST, message: 'Internal error' });
      if (errCode === 'ENOENT') {
        status = 404;
        body = JSON.stringify({ code: 'FILE_NOT_FOUND', message: 'Not Found' });
      } else if (errCode === 'EACCES' || errCode === 'EPERM') {
        status = 403;
        body = JSON.stringify({ code: 'FILE_ACCESS_DENIED', message: 'Forbidden' });
      }
      logError(ErrorCode.FILE_REQUEST, err, { url: request.url, resolvedPath, fsCode: errCode, status });
      return new Response(body, {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
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
