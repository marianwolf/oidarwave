let startTime = 0;

export function trackStationSelection(stationName, consentStatus) {
    if (consentStatus === 'all' || consentStatus === 'necessary') {
        const timestamp = new Date().toISOString();
        console.log(`[Tracking] Sender "${stationName}" ausgewählt um ${timestamp} (Consent: ${consentStatus}).`);
    }
}

export function trackListeningDuration(stationName, startMs, endMs, consentStatus) {
    if (consentStatus === 'all' || consentStatus === 'necessary') {
        const durationSeconds = Math.round((endMs - startMs) / 1000);
        console.log(`[Tracking] Benutzer hat "${stationName}" für ${durationSeconds} Sekunden gehört (Consent: ${consentStatus}).`);
    }
}

export function startListeningTimer(consentStatus) {
    if (consentStatus === 'all' || consentStatus === 'necessary') {
        startTime = Date.now();
    }
}

export function stopListeningTimer(stationName, consentStatus) {
    if ((consentStatus === 'all' || consentStatus === 'necessary') && startTime !== 0) {
        trackListeningDuration(stationName, startTime, Date.now(), consentStatus);
        startTime = 0;
    }
}