/**
 * Media Player - Initialisiert und verwaltet Audio/Video-Wiedergabe
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const StationHistory: any;

/**
 * Initialisiert den Media Player
 */
function initializePlayer(): void {
    let hasError = false;
    let isStalled = false;
    let isAudioPlayer = false;
    let metadataInterval: ReturnType<typeof setInterval> | null = null;

    // DOM Elemente
    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer') as HTMLAudioElement | null;
    const videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement | null;
    const currentStationDisplay = document.getElementById('currentStation') as HTMLElement | null;
    const statusIndicator = document.getElementById('statusIndicator') as HTMLElement | null;
    const currentSongTitleDisplay = document.getElementById('currentSongTitle') as HTMLElement | null;

    let currentPlayer: HTMLAudioElement | HTMLVideoElement | null = null;
    let lastStationKey = '';

    // Player bestimmen
    if (audioPlayer) {
        currentPlayer = audioPlayer;
        isAudioPlayer = true;
        currentPlayer.volume = 1;
        lastStationKey = 'lastStationAudioUrl';
    } else if (videoPlayer) {
        currentPlayer = videoPlayer;
        isAudioPlayer = false;
        lastStationKey = 'lastStationVideoUrl';
    } else {
        console.error("No player element found with id 'audioPlayer' or 'videoPlayer'.");
        return;
    }

    // Station Button Event Listeners
    stationButtons.forEach((button) => {
        button.addEventListener('click', () => {
            selectStation(button as HTMLElement);
        });
    });

    // Media Player Event Listeners
    currentPlayer.addEventListener('loadstart', () => {
        isStalled = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('canplay', () => {
        if (isAudioPlayer && currentPlayer && currentPlayer.paused) {
             playMedia();
        }
        isStalled = false;
        hasError = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('playing', () => {
        isStalled = false;
        hasError = false;
        updateOverallStatus();
        if (currentPlayer && currentPlayer.src && typeof StationHistory !== 'undefined') {
            StationHistory.startStation(currentPlayer.src, '');
        }
    });

    currentPlayer.addEventListener('pause', () => {
        updateOverallStatus();
        if (currentPlayer && currentPlayer.src && typeof StationHistory !== 'undefined') {
            StationHistory.stopStation(currentPlayer.src);
        }
    });

    currentPlayer.addEventListener('waiting', () => {
        isStalled = true;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('error', (e: Event) => {
        console.error('Media Error:', e);
        hasError = true;
        updateOverallStatus();
        if (currentPlayer && currentPlayer.src && typeof StationHistory !== 'undefined') {
            StationHistory.stopStation(currentPlayer.src);
        }
    });

    window.addEventListener('offline', () => {
        updateOverallStatus();
        if (currentPlayer && currentPlayer.src && typeof StationHistory !== 'undefined') {
            StationHistory.stopStation(currentPlayer.src);
        }
    });

    window.addEventListener('beforeunload', () => {
        if (metadataInterval) {
            clearInterval(metadataInterval);
        }
        if (currentPlayer && currentPlayer.src && typeof StationHistory !== 'undefined') {
            StationHistory.stopStation(currentPlayer.src);
        }
    });

    document.addEventListener('keydown', handleKeyDown);

    /**
     * Aktualisiert den Status-Indikator
     */
    function updateOverallStatus(): void {
        if (!statusIndicator) return;
        statusIndicator.classList.remove('online', 'error', 'buffering', 'paused');
        if (!navigator.onLine) {
            statusIndicator.classList.add('error');
            return;
        }
        if (hasError) {
            statusIndicator.classList.add('error');
        } else if (currentPlayer && currentPlayer.paused) {
            statusIndicator.classList.add('paused');
        } else if (isStalled) {
            statusIndicator.classList.add('buffering');
        } else {
            statusIndicator.classList.add('online');
        }
    }

    /**
     * Startet die Medienwiedergabe
     */
    function playMedia(): void {
        if (currentPlayer) {
            currentPlayer.play().catch((e) => {
                console.error("Autoplay Error:", e);
            });
        }
    }

    /**
     * Wählt eine Station aus und beginnt die Wiedergabe
     */
    function selectStation(button: HTMLElement): void {
        stationButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        
        const { url, name, metadataUrl } = button.dataset;
        if (currentStationDisplay && url && name) {
            currentStationDisplay.textContent = name;
            localStorage.setItem(lastStationKey, url);
        }
        
        if (metadataInterval) {
            clearInterval(metadataInterval);
        }
        
        if (metadataUrl && currentSongTitleDisplay) {
            fetchMetadata(metadataUrl);
            metadataInterval = setInterval(() => fetchMetadata(metadataUrl), 1000);
        } else if (currentSongTitleDisplay) {
            currentSongTitleDisplay.textContent = "Metadaten nicht verfügbar";
        }
        
        if (url) {
            handlePlayback(url);
        }
    }

    /**
     * Behandelt die Wiedergabe einer URL
     */
    function handlePlayback(url: string): void {
        if (currentPlayer) {
            currentPlayer.src = url;
            currentPlayer.load();
        }
    }

    /**
     * Behandelt Tastatureingaben für Mediensteuerung
     */
    function handleKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA') {
            return;
        }
        
        if (!currentPlayer) return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                currentPlayer.paused ? playMedia() : currentPlayer.pause();
                break;
            case 'ArrowUp':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = parseFloat(Math.min(1, currentPlayer.volume + 0.1).toFixed(1));
                }
                break;
            case 'ArrowDown':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = parseFloat(Math.max(0, currentPlayer.volume - 0.1).toFixed(1));
                }
                break;
        }
    }

    /**
     * Ruft Metadaten von der Quelle ab
     */
    function fetchMetadata(metadataUrl: string): void {
        fetch(metadataUrl)
            .then(async (response: Response) => {
                if (!response.ok) {
                    throw new Error(`Netzwerkfehler: ${response.status}`);
                }
                if (metadataUrl.endsWith('.txt')) {
                    const text: string = await response.text();
                    return { type: 'text' as const, data: text };
                }
                const json: Record<string, unknown> = await response.json();
                return { type: 'json' as const, data: json };
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((result: any) => {
                const { data, type } = result;
                let trackTitle: string | null = null;
                
                if (type === 'text' && typeof data === 'string') {
                    trackTitle = data.split('\n')[0].trim();
                } else if (type === 'json' && typeof data === 'object' && data !== null) {
                    trackTitle = getMusicInfo(data);
                }
                
                if (trackTitle && trackTitle.length > 0 && currentSongTitleDisplay) {
                    currentSongTitleDisplay.innerText = trackTitle;
                } else if (currentSongTitleDisplay) {
                    currentSongTitleDisplay.innerText = "Keine Titelinformationen";
                }
            })
            .catch((error: Error) => {
                console.error('Fehler beim Abrufen der Metadaten:', error);
                if (currentSongTitleDisplay) {
                    currentSongTitleDisplay.innerText = "Metadaten nicht verfügbar";
                }
            });
    }

    /**
     * Extrahiert Musik-Informationen aus den Metadaten
     */
    function getMusicInfo(data: Record<string, unknown>): string | null {
        const title = (data?.song_now_title as string) || 
                      ((data?.playlistItem as Record<string, unknown>)?.title as string) || undefined;
        const artist = (data?.name as string) || 
                       (data?.subtitle as string) || 
                       (data?.song_now_interpret as string) || 
                       ((data?.playlistItem as Record<string, unknown>)?.artist as string) || undefined;

        if (title && artist) {
            return `${title} - ${artist}`;
        } else if (title) {
            return title;
        } else if (artist) {
            return artist;
        }
        return null;
    }

    // Letzte Station wiederherstellen oder erste Station starten
    const lastStationUrl = localStorage.getItem(lastStationKey);
    const lastStationButton = lastStationUrl 
        ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`) 
        : null;
    
    if (lastStationButton) {
        selectStation(lastStationButton as HTMLElement);
    } else if (stationButtons.length > 0) {
        selectStation(stationButtons[0] as HTMLElement);
    }
    
    updateOverallStatus();
}

document.addEventListener('DOMContentLoaded', initializePlayer);
