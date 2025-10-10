function initializePlayer() {
    let hasError = false;
    let isStalled = false;
    let metadataInterval = null;

    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    const currentSongTitleDisplay = document.getElementById('currentSongTitle');

    let currentPlayer = null;
    let isAudioPlayer = false;
    let lastStationKey = '';

    if (audioPlayer) {
        currentPlayer = audioPlayer;
        isAudioPlayer = true;
        currentPlayer.volume = 1;
        lastStationKey = 'lastStationAudioUrl';
    } else if (videoPlayer) {
        currentPlayer = videoPlayer;
        lastStationKey = 'lastStationVideoUrl';
    } else {
        console.error("No player element found with id 'audioPlayer' or 'videoPlayer'.");
        return;
    }

    stationButtons.forEach(button => {
        button.addEventListener('click', () => selectStation(button));
    });

    ['loadstart', 'canplay', 'playing', 'pause', 'waiting', 'error'].forEach(event => {
        currentPlayer.addEventListener(event, handlePlayerEvent);
    });

    window.addEventListener('offline', updateOverallStatus);
    document.addEventListener('keydown', handleKeyDown);

    function handlePlayerEvent(e) {
        const { type } = e;
        if (type === 'error') {
            console.error('Media Error:', e);
            hasError = true;
        } else {
            hasError = false;
        }

        if (type === 'waiting') {
            isStalled = true;
        } else if (type === 'canplay' && isAudioPlayer) {
            playMedia();
            isStalled = false;
        } else if (type === 'playing' || type === 'loadstart') {
            isStalled = false;
        }

        updateOverallStatus();
    }

    function updateOverallStatus() {
        if (!statusIndicator) return;

        statusIndicator.className = '';

        if (!navigator.onLine || hasError) {
            statusIndicator.classList.add('error');
        } else if (currentPlayer.paused) {
            statusIndicator.classList.add('paused');
        } else if (isStalled) {
            statusIndicator.classList.add('buffering');
        } else {
            statusIndicator.classList.add('online');
        }
    }

    function playMedia() {
        currentPlayer.play().catch(e => {
            console.error("Autoplay Error:", e.message || e);
        });
    }

    function selectStation(button) {
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const { url, name, metadataUrl } = button.dataset;
        currentStationDisplay.textContent = name;
        localStorage.setItem(lastStationKey, url);

        clearInterval(metadataInterval);
        metadataInterval = null;

        if (metadataUrl) {
            const fetchAndSetMetadata = () => fetchMetadata(metadataUrl);
            fetchAndSetMetadata();
            metadataInterval = setInterval(fetchAndSetMetadata, 1000);
        } else {
            currentSongTitleDisplay.textContent = "Metadaten nicht verfügbar";
        }

        currentPlayer.src = url;
        currentPlayer.load();
    }

    function handleKeyDown(e) {
        if (e.target.closest('input, button')) {
            return;
        }

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                currentPlayer.paused ? playMedia() : currentPlayer.pause();
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                if (isAudioPlayer) {
                    e.preventDefault();
                    const delta = e.code === 'ArrowUp' ? 0.1 : -0.1;
                    currentPlayer.volume = Math.min(1, Math.max(0, currentPlayer.volume + delta));
                }
                break;
        }
    }

    async function fetchMetadata(metadataUrl) {
        try {
            const response = await fetch(metadataUrl);
            if (!response.ok) {
                throw new Error('Netzwerkfehler');
            }

            const data = metadataUrl.endsWith('.txt') ? await response.text() : await response.json();

            let trackTitle;
            if (typeof data === 'string') {
                trackTitle = data.split('\n')[0];
            } else {
                trackTitle = getMusicInfo(data);
            }

            currentSongTitleDisplay.innerText = trackTitle || "Keine Titelinformationen";

        } catch (error) {
            console.error('Fehler beim Abrufen der Metadaten:', error);
            currentSongTitleDisplay.innerText = "Metadaten nicht verfügbar";
        }
    }

    function getMusicInfo(data) {
        const title = data?.song_now_title || data?.playlistItem?.title;
        const artist = data?.name || data?.subtitle || data?.song_now_interpret || data?.playlistItem?.artist;

        if (title && artist) return `${title} - ${artist}`;
        if (title) return title;
        if (artist) return artist;
        return null;
    }

    const lastStationUrl = localStorage.getItem(lastStationKey);
    const lastStationButton = lastStationUrl ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`) : null;

    if (lastStationButton) {
        selectStation(lastStationButton);
    } else if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }

    updateOverallStatus();
}

document.addEventListener('DOMContentLoaded', initializePlayer);