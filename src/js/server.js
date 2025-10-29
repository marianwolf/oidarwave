const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const lastKnownTitles = {};
const subscribedUrls = new Map(); 

const PORT = 3000;

app.use(express.static('public'));

function getMusicInfo(data) {
    const title = data?.song_now_title || data?.playlistItem?.title;
    const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist;

    if (title && artist) {
        return `${title} - ${artist}`;
    } else if (title) {
        return title;
    } else if (artist) {
        return artist;
    }
    return null;
}

async function fetchAndParseMetadata(metadataUrl) {
    let trackTitle = null;
    let contentType = null;

    try {
        // Die native Node.js-Funktion 'fetch' wird jetzt automatisch verwendet.
        const response = await fetch(metadataUrl, { 
            headers: {
                'User-Agent': 'Oidarwave-Radio-Player/1.0 (Contact: marian.wolf2008@gmail.com)'
            }
        });

        if (!response.ok) {
            console.warn(`Fehler beim Abrufen von ${metadataUrl}: ${response.status}`);
            return "Metadaten-API Fehler";
        }
        
        contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            trackTitle = getMusicInfo(data);
        } else if (contentType && contentType.includes('text/plain')) {
            const data = await response.text();
            trackTitle = data.trim();
        } else if (metadataUrl.endsWith('.txt')) {
             const data = await response.text();
             trackTitle = data.trim();
        } else {
            trackTitle = "Unbekanntes Metadatenformat";
        }

    } catch (error) {
        console.error(`Fehler beim Abrufen/Parsen von ${metadataUrl}:`, error.message);
        trackTitle = "Metadaten-API Fehler";
    }
    
    return trackTitle;
}

io.on('connection', (socket) => {
    console.log(`Neuer Client verbunden: ${socket.id}`);

    socket.on('subscribe-metadata', (data) => {
        const { metadataUrl } = data;
        if (!metadataUrl) return;

        console.log(`Client ${socket.id} abonniert Metadaten-URL: ${metadataUrl}`);
        subscribedUrls.delete(socket.id); 
        subscribedUrls.set(socket.id, metadataUrl);
        
        socket.join(metadataUrl);
        if (lastKnownTitles[metadataUrl]) {
            socket.emit('song-update', { title: lastKnownTitles[metadataUrl] });
        } else {
        }
    });

    socket.on('unsubscribe-metadata', () => {
        const oldUrl = subscribedUrls.get(socket.id);
        if (oldUrl) {
            socket.leave(oldUrl);
            subscribedUrls.delete(socket.id);
            console.log(`Client ${socket.id} hat Subskription von ${oldUrl} beendet.`);
        }
    });

    socket.on('disconnect', () => {
        const oldUrl = subscribedUrls.get(socket.id);
        if (oldUrl) {
            socket.leave(oldUrl);
            subscribedUrls.delete(socket.id);
        }
        console.log(`Client getrennt: ${socket.id}`);
    });
});

const POLLING_INTERVAL = 5000; 

function startMetadataPolling() {
    const uniqueUrls = new Set(subscribedUrls.values());

    uniqueUrls.forEach(async (metadataUrl) => {
        const newTitle = await fetchAndParseMetadata(metadataUrl);

        if (newTitle && newTitle !== lastKnownTitles[metadataUrl]) {
            console.log(`Neuer Titel für ${metadataUrl}: ${newTitle}`);
            lastKnownTitles[metadataUrl] = newTitle;

            io.to(metadataUrl).emit('song-update', { title: newTitle });
        }
    });
}

setInterval(startMetadataPolling, POLLING_INTERVAL);
console.log(`Metadaten-Polling alle ${POLLING_INTERVAL / 1000} Sekunden gestartet.`);

server.listen(PORT, () => {
    console.log(`Server läuft auf http://oidarwave.vercel.app:${PORT}`);
    console.log(`Stellen Sie sicher, dass Ihre index.html von hier geladen wird.`);
});