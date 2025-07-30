// tracking.js

// Importiere Firebase Firestore-Funktionen
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


let startTime = 0;

// Firebase-Variablen (müssen hier exportiert werden, damit sie in index.html importiert werden können)
export let app;
export let auth;
export let db;
export let userId = 'anonymous'; // Standard-UserID, wird nach Authentifizierung aktualisiert
export let isFirebaseReady = false; // Flag, um zu signalisieren, dass Firebase initialisiert ist

// Firebase-Konfiguration (wird vom Canvas-Environment bereitgestellt)
// Diese Variablen werden global vom Canvas-Environment zur Verfügung gestellt
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/**
 * Initialisiert Firebase App, Authentifizierung und Firestore.
 * Stellt sicher, dass der Benutzer authentifiziert ist (anonym oder mit Token).
 */
export async function initializeFirebase() {
    try {
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase config is missing. Cannot initialize Firebase.");
            return;
        }
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                console.log("Firebase Authenticated. User ID:", userId);
                isFirebaseReady = true;
                // loadTrackingData() wird nun direkt nach der Authentifizierung aufgerufen
                loadTrackingData();
            } else {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Firebase Anonymous Auth Error:", error);
                    isFirebaseReady = true; // Trotz Fehler als bereit markieren, um App-Start nicht zu blockieren
                }
            }
        });
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
    }
}

/**
 * Lädt die letzten Tracking-Daten von Firestore und zeigt sie an.
 * Nutzt onSnapshot für Echtzeit-Updates.
 */
export async function loadTrackingData() {
    if (!isFirebaseReady) {
        console.log("Firebase not ready yet for loading tracking data.");
        return;
    }

    const trackingList = document.getElementById('trackingList');
    // Überprüfen, ob das Element existiert, bevor es manipuliert wird
    if (!trackingList) {
        console.warn("Element with ID 'trackingList' not found. Cannot display tracking data.");
        return;
    }
    trackingList.innerHTML = '<li>Lade Daten...</li>'; // Ladezustand anzeigen

    // Pfad zur benutzerspezifischen Sammlung
    const userTrackingCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/radio_tracking`);
    // Abfrage für die letzten 10 Einträge, sortiert nach Zeitstempel
    const q = query(userTrackingCollectionRef, orderBy('timestamp_utc', 'desc'), limit(10));

    // Echtzeit-Listener für Änderungen in der Sammlung
    onSnapshot(q, (snapshot) => {
        trackingList.innerHTML = ''; // Liste leeren
        if (snapshot.empty) {
            trackingList.innerHTML = '<li>Noch keine Tracking-Daten vorhanden.</li>';
            return;
        }
        snapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            let displayText = '';
            if (data.type === 'station_selection') { // 'type' statt 'event_type'
                displayText = `Auswahl: ${data.stationName} (${new Date(data.timestamp_utc).toLocaleString()})`;
            } else if (data.type === 'listening_duration') { // 'type' statt 'event_type'
                displayText = `Hördauer: ${data.stationName} für ${data.durationSeconds} Sek. (${new Date(data.timestamp_utc).toLocaleString()})`;
            }
            li.textContent = displayText;
            trackingList.appendChild(li);
        });
    }, (error) => {
        console.error("Error fetching tracking data:", error);
        trackingList.innerHTML = '<li>Fehler beim Laden der Daten.</li>';
    });
}


/**
 * Verfolgt die Auswahl eines Radiosenders und speichert sie in Firestore.
 * @param {object} dbInstance - Die Firestore-Datenbankinstanz.
 * @param {string} currentUserId - Die ID des aktuellen Benutzers.
 * @param {string} currentAppId - Die ID der aktuellen Anwendung.
 * @param {string} stationName - Der Name des ausgewählten Senders.
 * @param {string} consentStatus - Der aktuelle Cookie-Zustimmungsstatus ('all', 'necessary', 'denied').
 */
export async function trackStationSelection(dbInstance, currentUserId, currentAppId, stationName, consentStatus) {
    if (consentStatus === 'all' || consentStatus === 'necessary') {
        const timestamp = new Date().toISOString();
        const eventData = {
            type: 'station_selection', // Einheitlicher Typ-Schlüssel
            stationName: stationName,
            timestamp_utc: timestamp,
            user_consent: consentStatus
        };

        try {
            const docRef = await addDoc(collection(dbInstance, `artifacts/${currentAppId}/users/${currentUserId}/radio_tracking`), eventData);
            console.log(`[Tracking] Sender "${stationName}" ausgewählt und in Firestore gespeichert (ID: ${docRef.id}, Consent: ${consentStatus}).`);
        } catch (e) {
            console.error("[Tracking] Fehler beim Speichern der Senderauswahl in Firestore: ", e);
        }
    }
}

/**
 * Verfolgt die Dauer, die ein Benutzer einen Sender gehört hat, und speichert sie in Firestore.
 * @param {object} dbInstance - Die Firestore-Datenbankinstanz.
 * @param {string} currentUserId - Die ID des aktuellen Benutzers.
 * @param {string} currentAppId - Die ID der aktuellen Anwendung.
 * @param {string} stationName - Der Name des Senders.
 * @param {number} startMs - Der Start-Timestamp in Millisekunden.
 * @param {number} endMs - Der End-Timestamp in Millisekunden.
 * @param {string} consentStatus - Der aktuelle Cookie-Zustimmungsstatus ('all', 'necessary', 'denied').
 */
export async function trackListeningDuration(dbInstance, currentUserId, currentAppId, stationName, startMs, endMs, consentStatus) {
    if (consentStatus === 'all' || consentStatus === 'necessary') {
        const durationSeconds = Math.round((endMs - startMs) / 1000);
        const eventData = {
            type: 'listening_duration', // Einheitlicher Typ-Schlüssel
            stationName: stationName,
            durationSeconds: durationSeconds,
            timestamp_utc: new Date(startMs).toISOString(),
            timestamp_end_utc: new Date(endMs).toISOString(),
            user_consent: consentStatus
        };

        try {
            const docRef = await addDoc(collection(dbInstance, `artifacts/${currentAppId}/users/${currentUserId}/radio_tracking`), eventData);
            console.log(`[Tracking] Benutzer hat "${stationName}" für ${durationSeconds} Sekunden gehört und in Firestore gespeichert (ID: ${docRef.id}, Consent: ${consentStatus}).`);
        } catch (e) {
            console.error("[Tracking] Fehler beim Speichern der Hördauer in Firestore: ", e);
        }
    }
}

/**
 * Startet den Timer für die Hördauer.
 * @param {string} consentStatus - Der aktuelle Cookie-Zustimmungsstatus ('all', 'necessary', 'denied').
 */
export function startListeningTimer(consentStatus) {
    if (consentStatus === 'all' || consentStatus === 'necessary') {
        startTime = Date.now();
    }
}

/**
 * Stoppt den Timer für die Hördauer und protokolliert die Dauer.
 * @param {object} dbInstance - Die Firestore-Datenbankinstanz.
 * @param {string} currentUserId - Die ID des aktuellen Benutzers.
 * @param {string} currentAppId - Die ID der aktuellen Anwendung.
 * @param {string} stationName - Der Name des Senders.
 * @param {string} consentStatus - Der aktuelle Cookie-Zustimmungsstatus ('all', 'necessary', 'denied').
 */
export function stopListeningTimer(dbInstance, currentUserId, currentAppId, stationName, consentStatus) {
    if ((consentStatus === 'all' || consentStatus === 'necessary') && startTime !== 0) {
        trackListeningDuration(dbInstance, currentUserId, currentAppId, stationName, startTime, Date.now(), consentStatus);
        startTime = 0; // Startzeit zurücksetzen
    }
}