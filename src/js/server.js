const io = require('socket.io')(server);
let metadataInterval = null;

function fetchMetadata(metadataUrl, socket) {
    fetch(metadataUrl)
        .then(response => {
            if (!response.ok) {
                socket.emit('currentSong', "Metadatenfehler (HTTP)"); 
                throw new Error(`Netzwerkfehler: ${response.status}`);
            }
            if (metadataUrl.endsWith('.txt')) {
                return response.text().then(text => ({ type: 'text', data: text }));
            }
            return response.json().then(json => ({ type: 'json', data: json }));
        })
        .then(({ data, type }) => {
            let trackTitle;
            if (type === 'text' && typeof data === 'string') {
                trackTitle = data.split('\n')[0].trim();
            } else if (type === 'json') {
                trackTitle = getMusicInfo(data);
            }
            
            if (trackTitle && trackTitle.length > 0) {
                socket.emit('currentSong', trackTitle);
            } else {
                socket.emit('currentSong', "Keine Titelinformationen");
            }
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Metadaten:', error);
            socket.emit('currentSong', "Metadaten nicht verfügbar");
        });
}

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


io.on('connection', (socket) => {
    console.log('A client connected');

    socket.on('startMetadata', (metadataUrl) => {
        if (metadataInterval) {
            clearInterval(metadataInterval);
        }
        
        fetchMetadata(metadataUrl, socket);
        metadataInterval = setInterval(() => {
            fetchMetadata(metadataUrl, socket);
        }, 1000); 
    });

    socket.on('stopMetadata', () => {
        if (metadataInterval) {
            clearInterval(metadataInterval);
            metadataInterval = null;
        }
    });

    socket.on('disconnect', () => {
        if (metadataInterval) {
            clearInterval(metadataInterval);
        }
        console.log('Client disconnected');
    });
});