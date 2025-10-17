
    let sleepTimerTimeout = null;
    let activeAlarm = null;

    const sleepTimerControls = document.getElementById('sleepTimerControls');
    const alarmDisplay = document.getElementById('alarmDisplay');


function startSleepTimer(minutes) {
        clearSleepTimer();
        
        const milliseconds = minutes * 60 * 1000;
        
        sleepTimerTimeout = setTimeout(() => {
            if (currentPlayer && !currentPlayer.paused) {
                currentPlayer.pause();
                console.log(`Sleep Timer: Wiedergabe nach ${minutes} Minuten gestoppt.`);
            }
            clearSleepTimer(); 
        }, milliseconds);

        console.log(`Sleep Timer: Gestartet. Stoppt in ${minutes} Minuten.`);
        updateSleepTimerDisplay(minutes);
    }

    function clearSleepTimer() {
        if (sleepTimerTimeout) {
            clearTimeout(sleepTimerTimeout);
            sleepTimerTimeout = null;
        }
        updateSleepTimerDisplay(0);
        console.log("Sleep Timer: Gelöscht.");
    }
    
    function updateSleepTimerDisplay(minutes) {
        if (sleepTimerControls) {
            if (minutes > 0) {
                sleepTimerControls.setAttribute('data-active', 'true');
                sleepTimerControls.querySelector('.timer-status').textContent = `Timer: ${minutes} Min`;
            } else {
                sleepTimerControls.setAttribute('data-active', 'false');
                sleepTimerControls.querySelector('.timer-status').textContent = 'Timer Inaktiv';
            }
        }
    }

    function setAlarm(time, stationUrl, stationName) {
        activeAlarm = { time, stationUrl, stationName, isActive: true };
        
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        let alarmDate = new Date();
        alarmDate.setHours(hours, minutes, 0, 0);

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
    
    function clearAlarm() {
        activeAlarm = null;
        console.log("Alarm gelöscht.");
        updateAlarmDisplay();
    }
    
    function triggerAlarm(stationUrl, stationName) {
        if (!activeAlarm || !activeAlarm.isActive) return;
        
        console.log(`ALARM! Wecke mit Sender: ${stationName}`);

        const alarmButton = document.querySelector(`.station-btn[data-url="${stationUrl}"]`);
        if (alarmButton) {
            selectStation(alarmButton);
        }

        clearAlarm();
    }

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


    if (sleepTimerControls) {
        sleepTimerControls.querySelectorAll('[data-timer-min]').forEach(button => {
            button.addEventListener('click', () => {
                const minutes = parseInt(button.dataset.timerMin, 10);
                startSleepTimer(minutes);
            });
        });
        sleepTimerControls.querySelector('.timer-clear-btn').addEventListener('click', clearSleepTimer);
    }
    
    if (document.getElementById('setAlarmBtn')) {
        document.getElementById('setAlarmBtn').addEventListener('click', () => {
            const time = prompt("Alarmzeit eingeben (HH:MM), z.B. 07:30:");
            if (time) {
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