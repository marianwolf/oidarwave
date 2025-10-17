function initializePlayer() {
    let hasError = false;
    let isStalled = false;
    let isAudioPlayer = false;
    let metadataInterval = null;
    
    // Neue Variablen für Sleep Timer und Alarm
    let sleepTimerTimeout = null;
    let activeAlarm = null;

    const stationButtons = document.querySelectorAll('.station-btn');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const currentStationDisplay = document.getElementById('currentStation');
    const statusIndicator = document.getElementById('statusIndicator');
    const currentSongTitleDisplay = document.getElementById('currentSongTitle');
    
    // Neue Elemente für die Timer/Alarm-Funktionen (Annahme, sie existieren in HTML)
    const sleepTimerControls = document.getElementById('sleepTimerControls'); // Steuerelemente für den Sleep Timer
    const alarmDisplay = document.getElementById('alarmDisplay'); // Anzeige für den aktiven Alarm

    let currentPlayer = null;
    let lastStationKey = '';

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

    // --- Sleep Timer Funktionen ---

    /**
     * Startet den Schlaftimer.
     * @param {number} minutes - Die Zeit in Minuten, nach der die Wiedergabe stoppen soll.
     */
    function startSleepTimer(minutes) {
        clearSleepTimer();
        
        const milliseconds = minutes * 60 * 1000;
        
        sleepTimerTimeout = setTimeout(() => {
            if (currentPlayer && !currentPlayer.paused) {
                currentPlayer.pause();
                console.log(`Sleep Timer: Wiedergabe nach ${minutes} Minuten gestoppt.`);
                // Hier könnte eine Benachrichtigung an den Benutzer erfolgen
            }
            // Timer zurücksetzen, da er ausgelöst wurde
            clearSleepTimer(); 
        }, milliseconds);

        console.log(`Sleep Timer: Gestartet. Stoppt in ${minutes} Minuten.`);
        updateSleepTimerDisplay(minutes);
    }

    /**
     * Löscht den aktuell laufenden Schlaftimer.
     */
    function clearSleepTimer() {
        if (sleepTimerTimeout) {
            clearTimeout(sleepTimerTimeout);
            sleepTimerTimeout = null;
        }
        updateSleepTimerDisplay(0);
        console.log("Sleep Timer: Gelöscht.");
    }
    
    /**
     * Aktualisiert die Anzeige des Sleep Timers auf der Benutzeroberfläche.
     * Da wir keinen Counter implementieren, zeigen wir nur den Status an.
     * @param {number} minutes - Verbleibende Minuten (0, wenn inaktiv).
     */
    function updateSleepTimerDisplay(minutes) {
        if (sleepTimerControls) {
            if (minutes > 0) {
                // Annahme: Es gibt ein Element innerhalb von sleepTimerControls zur Anzeige
                sleepTimerControls.setAttribute('data-active', 'true');
                sleepTimerControls.querySelector('.timer-status').textContent = `Timer: ${minutes} Min`;
            } else {
                sleepTimerControls.setAttribute('data-active', 'false');
                sleepTimerControls.querySelector('.timer-status').textContent = 'Timer Inaktiv';
            }
        }
    }

    // --- Alarm Funktionen (Framework) ---
    
    /**
     * Setzt einen Alarm für eine bestimmte Zeit und einen Sender.
     * Da Weckerfunktionen im Browser (ohne PWA/Native) sehr unzuverlässig sind,
     * wird hier nur die Logik für die Speicherung und Anzeige erstellt.
     * Die eigentliche Weckfunktion (die im Hintergrund laufen müsste) ist ein Platzhalter.
     * @param {string} time - Die Weckzeit (z.B. "07:30").
     * @param {string} stationUrl - Der URL des Senders, der abgespielt werden soll.
     * @param {string} stationName - Der Name des Senders.
     */
    function setAlarm(time, stationUrl, stationName) {
        // Alarm speichern (hier nur im Speicher, für Persistenz müsste Firestore/LocalStorage genutzt werden)
        activeAlarm = { time, stationUrl, stationName, isActive: true };
        
        // Simuliere die Weckzeit-Berechnung (Implementierung der Hintergrund-Logik fehlt)
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        let alarmDate = new Date();
        alarmDate.setHours(hours, minutes, 0, 0);

        // Wenn die Zeit heute schon vorbei ist, setze sie auf morgen
        if (alarmDate <= now) {
            alarmDate.setDate(alarmDate.getDate() + 1);
        }
        
        const delayMs = alarmDate.getTime() - now.getTime();
        
        console.log(`Alarm gesetzt für ${time} (${stationName}). Weckt in ${Math.round(delayMs / 1000 / 60)} Minuten.`);
        
        // WICHTIG: Die setTimeout-Funktion ist in einem modernen Browser 
        // NICHT ZUVERLÄSSIG, wenn der Tab geschlossen oder der Bildschirm gesperrt wird.
        // Dies ist nur ein Konzept-Platzhalter.
        setTimeout(() => {
            triggerAlarm(stationUrl, stationName);
        }, delayMs);
        
        updateAlarmDisplay();
    }
    
    /**
     * Löscht den aktiven Alarm.
     */
    function clearAlarm() {
        activeAlarm = null;
        console.log("Alarm gelöscht.");
        updateAlarmDisplay();
    }
    
    /**
     * Simuliert das Auslösen des Alarms.
     * @param {string} stationUrl - Der URL des Senders.
     * @param {string} stationName - Der Name des Senders.
     */
    function triggerAlarm(stationUrl, stationName) {
        if (!activeAlarm || !activeAlarm.isActive) return;
        
        console.log(`ALARM! Wecke mit Sender: ${stationName}`);

        // Finde den entsprechenden Button und spiele ihn ab
        const alarmButton = document.querySelector(`.station-btn[data-url="${stationUrl}"]`);
        if (alarmButton) {
            selectStation(alarmButton);
        }
        
        // Logik für lautes Abspielen, Vibration etc.
        // Da wir keine native App sind, spielen wir einfach ab.
        
        // Alarm zurücksetzen
        clearAlarm();
    }
    
    /**
     * Aktualisiert die Anzeige des Alarms.
     */
    function updateAlarmDisplay() {
        if (alarmDisplay) {
            if (activeAlarm) {
                alarmDisplay.setAttribute('data-active', 'true');
                alarmDisplay.querySelector('.alarm-status').textContent = `Alarm: ${activeAlarm.time} (${activeAlarm.stationName})`;
            } else {
                alarmDisplay.setAttribute('data-active', 'false');
                alarmDisplay.querySelector('.alarm-status').textContent = 'Kein Alarm';
            }
        }
    }


    // --- Bestehende Initialisierung und Event-Listener ---

    stationButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectStation(button);
        });
    });
    
    // Füge Event-Listener für Sleep Timer Steuerung hinzu
    if (sleepTimerControls) {
        // Beispiel: Tasten für 30, 60, 90 Minuten
        sleepTimerControls.querySelectorAll('[data-timer-min]').forEach(button => {
            button.addEventListener('click', () => {
                const minutes = parseInt(button.dataset.timerMin, 10);
                startSleepTimer(minutes);
            });
        });
        // Beispiel: Taste zum Abbrechen
        sleepTimerControls.querySelector('.timer-clear-btn').addEventListener('click', clearSleepTimer);
    }
    
    // Füge Event-Listener für Alarm Steuerung hinzu (Platzhalter, da HTML-Elemente fehlen)
    if (document.getElementById('setAlarmBtn')) {
        document.getElementById('setAlarmBtn').addEventListener('click', () => {
            // Dies würde normalerweise ein Modal öffnen und die Zeit/den Sender abfragen
            const time = prompt("Alarmzeit eingeben (HH:MM), z.B. 07:30:");
            if (time) {
                // Wählt den aktuell aktiven Sender als Alarm-Sender aus (zur Vereinfachung)
                const currentButton = document.querySelector('.station-btn.active');
                if (currentButton) {
                    setAlarm(time, currentButton.dataset.url, currentButton.dataset.name);
                } else {
                    console.error("Kein aktiver Sender zum Setzen des Alarms gefunden.");
                }
            }
        });
    }
    if (document.getElementById('clearAlarmBtn')) {
        document.getElementById('clearAlarmBtn').addEventListener('click', clearAlarm);
    }
    // Ende der neuen Event-Listener

    currentPlayer.addEventListener('loadstart', () => {
        isStalled = false;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('canplay', () => {
        if (isAudioPlayer) {
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
    });

    currentPlayer.addEventListener('pause', () => {
        updateOverallStatus();
    });

    currentPlayer.addEventListener('waiting', () => {
        isStalled = true;
        updateOverallStatus();
    });

    currentPlayer.addEventListener('error', (e) => {
        console.error('Media Error:', e);
        hasError = true;
        updateOverallStatus();
    });

    window.addEventListener('offline', () => {
        updateOverallStatus();
    });

    document.addEventListener('keydown', handleKeyDown);

    function updateOverallStatus() {
        if (!statusIndicator) return;

        statusIndicator.classList.remove('online', 'error', 'buffering', 'paused');

        if (!navigator.onLine) {
            statusIndicator.classList.add('error');
            return;
        }

        if (hasError) {
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
            console.error("Autoplay Error:", e);
        });
    }

    function selectStation(button) {
        // Wichtig: Beim Senderwechsel den Sleep Timer löschen, da der Nutzer aktiv wurde
        clearSleepTimer(); 
        
        stationButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const { url, name, metadataUrl } = button.dataset;
        currentStationDisplay.textContent = name;

        localStorage.setItem(lastStationKey, url);

        if (metadataInterval) {
            clearInterval(metadataInterval);
        }

        if (metadataUrl) {
            fetchMetadata(metadataUrl);
            metadataInterval = setInterval(() => {
                fetchMetadata(metadataUrl);
            }, 1000);
        } else {
            currentSongTitleDisplay.textContent = "Metadaten nicht verfügbar";
        }

        if (isAudioPlayer) {
            handleAudioPlayback(url);
        } else {
            handleVideoPlayback(url);
        }
    }

    function handleAudioPlayback(url) {
        currentPlayer.src = url;
        currentPlayer.load();
    }

    function handleVideoPlayback(url) {
        // Bei Videowiedergabe wird in video.js die HLS-Logik behandelt
        // Wenn video.js eingebunden ist, wird diese Funktion überschrieben oder ignoriert
        // (je nach Implementierung der HTML-Struktur)
        console.warn("Video-Wiedergabe wird in 'video.js' (HLS-Logik) oder hier einfach als Standard-Src behandelt.");
        currentPlayer.src = url;
        currentPlayer.load();
    }

    function handleKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
            return;
        }
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (currentPlayer.paused) {
                    playMedia();
                } else {
                    currentPlayer.pause();
                }
                break;
            case 'ArrowUp':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = Math.min(1, currentPlayer.volume + 0.1);
                }
                break;
            case 'ArrowDown':
                if (isAudioPlayer) {
                    e.preventDefault();
                    currentPlayer.volume = Math.max(0, currentPlayer.volume - 0.1);
                }
                break;
        }
    }

    function fetchMetadata(metadataUrl) {
        fetch(metadataUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netzwerkfehler');
                }
                if (metadataUrl.endsWith('.txt')) {
                    return response.text();
                }
                return response.json();
            })
            .then(data => {
                let trackTitle;
                if (typeof data === 'string') {
                    trackTitle = data.split('\n')[0];
                } else {
                    trackTitle = getMusicInfo(data);
                }
                if (trackTitle) {
                    currentSongTitleDisplay.innerText = trackTitle;
                } else {
                    currentSongTitleDisplay.innerText = "Keine Titelinformationen";
                }
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der Metadaten:', error);
                currentSongTitleDisplay.innerText = "Metadaten nicht verfügbar";
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

    const lastStationUrl = localStorage.getItem(lastStationKey);
    const lastStationButton = lastStationUrl ? document.querySelector(`.station-btn[data-url="${lastStationUrl}"]`) : null;

    if (lastStationButton) {
        selectStation(lastStationButton);
    } else if (stationButtons.length > 0) {
        selectStation(stationButtons[0]);
    }
    updateOverallStatus();
    updateSleepTimerDisplay(0); // Initialen Zustand anzeigen
    updateAlarmDisplay(); // Initialen Zustand anzeigen
}

document.addEventListener('DOMContentLoaded', initializePlayer);