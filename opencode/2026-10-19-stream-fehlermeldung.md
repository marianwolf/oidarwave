# 2026-10-19 – Stream-Fehlermeldung aufräumen

## Ziel

Die Meldung bei fehlender Stream-Verbindung sollte lesbar formatiert sein und
nach dem endgültigen Fehlschlag nicht dauerhaft stehen bleiben.

## Ursachen

- `PlayerCore.setStatusClass()` entfernte beim Statuswechsel die Klasse `text`,
  ließ aber `textContent` stehen. Der Countdown-Text lief dadurch ohne Padding
  und ohne Pill-Hintergrund aus dem 12-px-Status-Punkt in die Senderzeile.
- `showExhaustedText()` setzte „Verbindung verloren – erneut versuchen“ ohne
  Timeout und ohne echte Aktion – die Meldung blieb dauerhaft stehen.
- `.current-station` vererbt `text-wrap: balance`; dadurch wurde die kurze
  Endmeldung auch bei ausreichend Platz künstlich zweizeilig umbrochen.

## Geänderte Dateien

- `src/js/player-core.js`
  - `createStatusDisplay.showMessage(message, type, duration, nextStatus)`:
    setzt zuerst den Status (entfernt alte Klassen inkl. `text`), setzt dann
    Text und Text-Klasse; `nextStatus` bestimmt den Zustand nach dem Auto-Hide
    (z. B. `error`, damit der Punkt rot bleibt).
- `src/js/player.js`
  - Statusmeldungen laufen jetzt vollständig über `createStatusDisplay`;
    doppelte `clearStatusText`/`setStatusClass`-Logik entfernt.
  - `updateOverallStatus()` überschreibt eine sichtbare Meldung nicht mehr
    (sonst verliert sie ihre Formatierung und bleibt als Rohtext stehen).
  - Retry-Pill: `Versuch n/3 in x s` + erklärender `title`.
  - Endmeldung: `Stream nicht erreichbar`, rot, nach 6 s automatisch aus,
    roter Status-Punkt bleibt; `title` erklärt den Fehler weiter.
  - `retryAudio()` löst den Countdown sofort auf (Punkt pulsiert während des
    Versuchs, kein veralteter Countdown).
  - `offline` löst eine sichtbare Meldung sofort auf; bei `online` startet die
    Retry-Sequenz wieder. `title` wird bei erfolgreicher Wiederverbindung
    entfernt.
- `src/css/style.css`
  - `.status-indicator`: `overflow: hidden` als Sicherheitsnetz gegen Text im
    Punkt.
  - `.status-indicator.text`: `max-width: 100%`, Umbruch statt `nowrap`,
    `text-wrap: wrap` gegen das geerbte `balance`, `flex-shrink: 1` und etwas
    kompakteres vertikales Padding.

## Verifikation

- Playwright gegen lokalen HTTP-Server mit abgebrochenem Stream:
  - Countdown `Versuch 1/3 in 1 s` bleibt als orange Pill formatiert
    (143 × 26,8 px), auch wenn währenddessen Status-Events eintreffen.
  - Endmeldung `Stream nicht erreichbar` einzeilig (178 × 26,8 px), rot,
    nach 6 s verschwunden, Status-Punkt bleibt rot (12 px).
  - `offline` mitten im Countdown: Meldung sofort weg, roter Punkt; `online`
    startet die Retry-Sequenz erneut.
  - Senderwechsel nach Fehler: Meldung/Tooltip weg, grüner Online-Punkt.
  - Mobil 390 px: Meldung einzeilig, kein Überlauf.
- `pytest tests/` → **15 passed, 1 xfailed**, **9 xpassed**.
- `npx prettier --check` für die geänderten Dateien → sauber.

## Offene Punkte

- Die HLS-Video-Meldung ließ sich durch Blockieren der `.m3u8`-Requests im
  Testfenster (20 s) nicht auslösen; sie nutzt denselben `createStatusDisplay`-
  Pfad, dessen Formatierung oben geprüft wurde.
- Der `title`-Tooltip bleibt nach dem Auto-Hide am roten Punkt, bis die
  Verbindung zurückkehrt oder der Sender gewechselt wird (bewusst).
