const { app, BrowserWindow, protocol, shell, net } = require('electron')
const path = require('path')
const fs = require('fs')
const { fileURLToPath, pathToFileURL } = require('url')

// Optionaler Logger mit Fallback – electron-log kann im gepackten asar-Build fehlen
// (devDependencies landen nicht in app.asar). Ein ungeschütztes require würde den
// Main-Prozess mit "Cannot find module" töten; errors.js nutzt denselben try/catch-Fallback.
function createLoggerFallback() {
    try {
        const log = require('electron-log')
        log.transports.file.level = 'debug'
        log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} {level}: {msg}'
        log.transports.console.level = 'debug'
        return log
    } catch (err) {
        console.debug('[oidarwave] electron-log nicht verfügbar, verbleibe bei Konsolen-Logging:', err?.code || err)
        return console
    }
}
const log = createLoggerFallback()

const { ErrorCode, logError, logWarn, initMainProcessErrorHandlers } = require('../src/js/errors.js')
initMainProcessErrorHandlers()

const WINDOW_OPTIONS = {
    width: 1200,
    height: 800,
    show: false, // Prevent the initial white flash
    backgroundColor: '#0f172a', // Set to --color-bg-base for premium look and feel
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        sandbox: true, // Explicitly enable process sandboxing for safety
    },
    icon: path.join(__dirname, '..', 'favicon/favicon.svg'),
}

const APP_DIR = path.resolve(path.join(__dirname, '..'))
const INDEX_HTML = path.join(APP_DIR, 'index.html')

// Externe Ziele (Web/Mail) dürfen nie in der App geladen werden
const isExternalUrl = (url) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')

// Externe Links im System-Browser statt im App-Fenster öffnen
function openExternalSafe(url) {
    shell.openExternal(url).catch((err) => logWarn(ErrorCode.INVALID_NAVIGATION_URL, err, { url }))
}

// Fenster aus den Standard-Optionen erstellen und erst nach ready-to-show anzeigen
function createBrowserWindow() {
    const win = new BrowserWindow(WINDOW_OPTIONS)
    win.once('ready-to-show', () => win.show())
    return win
}

// Verzeichnisse, die bei der Seiten-Erkennung nie gescannt werden
let ignoredDirsPromise = null

async function getIgnoredDirs(appDir) {
    if (!ignoredDirsPromise) {
        ignoredDirsPromise = (async () => {
            const defaultIgnored = [
                'node_modules',
                '.git',
                'dist',
                'electron',
                '.venv',
                'openwiki',
                'tests',
                '__pycache__',
                '.pytest_cache',
            ]
            const ignoreFilePath = path.join(appDir, '.npmignore')
            try {
                const content = await fs.promises.readFile(ignoreFilePath, 'utf8')
                const lines = content
                    .split('\\n')
                    .map((line) => line.trim().replace(/\/$/, ''))
                    .filter((line) => line && !line.startsWith('#'))
                return new Set([...defaultIgnored, ...lines])
            } catch (err) {
                if (err.code === 'ENOENT') {
                    return new Set(defaultIgnored)
                }
                logError(ErrorCode.NPMIGNORE_READ, err, { path: ignoreFilePath, code: err.code })
                return new Set(defaultIgnored)
            }
        })()
    }
    return ignoredDirsPromise
}

function buildPageEntry(route, file) {
    const pageRouteNorm = route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route
    const pageFileNorm = file.replace(/\\/g, '/')
    const pageFileDir = pageFileNorm.replace(/\/index\.html$/, '')
    return { route, file, pageRouteNorm, pageFileNorm, pageFileDir }
}

// Alle verfügbaren HTML-Unterseiten dynamisch erkennen
async function discoverPages(dir, basePath = '', appDir) {
    const pages = []
    try {
        const items = await fs.promises.readdir(dir, { withFileTypes: true })

        // Dateisystem-Zugriffe parallel verarbeiten
        await Promise.all(
            items.map(async (item) => {
                if (item.isSymbolicLink()) return

                const fullPath = path.join(dir, item.name)
                const resolvedPath = path.resolve(fullPath)
                if (resolvedPath !== appDir && !resolvedPath.startsWith(appDir + path.sep)) return

                const routePath = path.join(basePath, item.name).replace(/\\/g, '/')

                if (item.isDirectory()) {
                    const ignoredDirs = await getIgnoredDirs(appDir)
                    if (ignoredDirs.has(item.name)) return
                    const subPages = await discoverPages(resolvedPath, routePath, appDir)
                    pages.push(...subPages)
                } else if (item.isFile() && item.name === 'index.html' && basePath) {
                    pages.push(buildPageEntry('/' + basePath, resolvedPath))
                }
            })
        )
    } catch (err) {
        logError(ErrorCode.PAGE_DISCOVERY, err, { dir, basePath, appDir, pagesFound: pages.length })
    }
    return pages
}

function matchesRoute(pathname, page) {
    let decodedPathname
    try {
        decodedPathname = decodeURIComponent(pathname)
    } catch (err) {
        logWarn(ErrorCode.PAGE_DISCOVERY, err, { pathname, reason: 'decodeURIComponent' })
        decodedPathname = pathname
    }
    const normalizedPathname =
        decodedPathname.length > 1 && decodedPathname.endsWith('/') ? decodedPathname.slice(0, -1) : decodedPathname
    const pathnameNoSlash = normalizedPathname.startsWith('/') ? normalizedPathname.slice(1) : normalizedPathname

    return (
        normalizedPathname === page.pageRouteNorm ||
        normalizedPathname === page.pageRouteNorm + '/index.html' ||
        normalizedPathname === page.pageFileNorm ||
        pathnameNoSlash === page.pageFileNorm ||
        normalizedPathname === page.pageFileDir ||
        pathnameNoSlash === page.pageFileDir
    )
}

let availablePagesPromise = null

// Verfügbare Seiten erkennen und als Promise cachen (verhindert parallele Scans)
function getAvailablePages(appDir) {
    if (!availablePagesPromise) {
        availablePagesPromise = (async () => {
            const pages = await discoverPages(appDir, '', appDir)
            pages.unshift(buildPageEntry('/', path.join(appDir, 'index.html')))
            return pages
        })()
    }
    return availablePagesPromise
}

async function createWindow() {
    const availablePages = await getAvailablePages(APP_DIR)

    const mainWindow = createBrowserWindow()

    // Findet die bekannte Seite für eine URL (inkl. oidarwave://-Routen) oder null
    function matchPage(url) {
        let targetUrl = url
        if (url.startsWith('oidarwave://')) {
            const route = url.replace('oidarwave://', '').replace(/^\/+/, '')
            targetUrl = 'file:///' + route
        }
        try {
            const pathname = new URL(targetUrl).pathname

            for (const page of availablePages) {
                if (matchesRoute(pathname, page)) {
                    return page
                }
            }
        } catch (err) {
            logWarn(ErrorCode.INVALID_NAVIGATION_URL, err, { url })
        }
        return null
    }

    function tryLoadSubpage(targetWin, url) {
        const page = matchPage(url)
        if (!page) return false
        targetWin.loadFile(page.file)
        return true
    }

    function setupWindow(win) {
        const handleNavigation = (event, url) => {
            // Externe Ziele (Web/Mail) immer abfangen und im System-Browser öffnen
            if (isExternalUrl(url)) {
                event.preventDefault()
                openExternalSafe(url)
                return
            }
            // Sub-Frames laden im Frame selbst: bekannte Routen zulassen
            // (file-Protokoll-Handler resolviert absolute Pfade gegen APP_DIR),
            // unbekannte blocken – niemals das ganze Fenster einreißen.
            if (event.isMainFrame === false) {
                if (matchPage(url)) return // Navigation im Frame zulassen
                event.preventDefault()
                logWarn(ErrorCode.INVALID_NAVIGATION_URL, null, {
                    url,
                    reason: 'frame-navigation-blocked',
                })
                return
            }
            // Jede Main-Frame-Navigation abfangen: interne Ziele über
            // tryLoadSubpage – die App bleibt der Kontrollpunkt.
            event.preventDefault()
            if (!tryLoadSubpage(win, url)) {
                win.loadFile(INDEX_HTML)
            }
        }

        win.webContents.on('will-navigate', handleNavigation)
        win.webContents.on('will-redirect', handleNavigation) // Redirect-Bypass verhindern
        win.webContents.on('will-frame-navigate', handleNavigation) // iframe-Bypass verhindern

        win.webContents.setWindowOpenHandler(({ url }) => {
            if (isExternalUrl(url)) {
                openExternalSafe(url)
            } else if (url.startsWith('file://') || url.startsWith('oidarwave://')) {
                const newWin = createBrowserWindow()
                setupWindow(newWin)

                if (!tryLoadSubpage(newWin, url)) {
                    newWin.loadFile(INDEX_HTML)
                }
            }
            return { action: 'deny' }
        })
    }

    setupWindow(mainWindow)
    mainWindow.loadFile(INDEX_HTML)
}

app.whenReady().then(async () => {
    // 'file'-Protokoll sicher registrieren bzw. überschreiben
    protocol.handle('file', async (request) => {
        let resolvedPath = null
        try {
            const parsedUrl = new URL(request.url)

            // Query-Parameter und Hash entfernen (stören die Pfad-Auflösung)
            parsedUrl.search = ''
            parsedUrl.hash = ''

            let filePath = fileURLToPath(parsedUrl.href)

            // HTML-Seiten nutzen absolute Pfade (z. B. /src/css/style.css), die unter
            // file:// ins Dateisystem-Root aufgelöst würden. Existiert der Pfad nicht,
            // relativ zum App-Verzeichnis auflösen – wie bei einem Webserver.
            if (!fs.existsSync(filePath) && parsedUrl.pathname.startsWith('/')) {
                let candidatePath = path.join(APP_DIR, parsedUrl.pathname)
                // Routen (/impressum, /video, ...) zielen auf Verzeichnisse –
                // wie ein Webserver die Directory-Default index.html liefern.
                // Ohne diesen Schritt scheitert z. B. ein Frame-Load.
                if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
                    candidatePath = path.join(candidatePath, 'index.html')
                }
                if (fs.existsSync(candidatePath)) {
                    filePath = candidatePath
                }
            }

            const resolvedPathInner = path.resolve(filePath)

            const relative = path.relative(APP_DIR, resolvedPathInner)
            const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative)

            // Aufgelöster Pfad muss unter appDir liegen (Path-Traversal verhindern)
            if (!isSafe) {
                logError(ErrorCode.PATH_TRAVERSAL, null, {
                    url: request.url,
                    resolvedPath: resolvedPathInner,
                    appDir: APP_DIR,
                    referer: request.headers.get('referer'),
                })
                return new Response(JSON.stringify({ code: ErrorCode.PATH_TRAVERSAL, url: request.url }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                })
            }

            resolvedPath = resolvedPathInner
            const fileUrl = pathToFileURL(resolvedPath).toString()
            return net.fetch(fileUrl, { bypassCustomProtocolHandlers: true })
        } catch (err) {
            const errCode = err.code || 'UNKNOWN'
            let status = 500
            let body = JSON.stringify({ code: ErrorCode.FILE_REQUEST, message: 'Internal error' })
            if (errCode === 'ENOENT') {
                status = 404
                body = JSON.stringify({ code: 'FILE_NOT_FOUND', message: 'Not Found' })
            } else if (errCode === 'EACCES' || errCode === 'EPERM') {
                status = 403
                body = JSON.stringify({ code: 'FILE_ACCESS_DENIED', message: 'Forbidden' })
            }
            logError(ErrorCode.FILE_REQUEST, err, { url: request.url, resolvedPath, fsCode: errCode, status })
            return new Response(body, {
                status,
                headers: { 'Content-Type': 'application/json' },
            })
        }
    })

    await createWindow()

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
