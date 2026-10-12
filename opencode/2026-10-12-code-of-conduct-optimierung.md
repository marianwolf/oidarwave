# 2026-10-12 Code of Conduct Optimierung

## Ziel
CODE_OF_CONDUCT.md straffen, Unschärfen fixen, konsistent zu AGENTS.md / SECURITY.md machen.

## Geänderte Dateien
- CODE_OF_CONDUCT.md (v2.0 -> v2.1, Datum 12.10.2026)

## Änderungen
- Geltungsbereich erweitert: projektbezogene private Kommunikation eingeschlossen.
- Geschützte Merkmale um Behinderung ergänzt, Doxing explizit benannt.
- Meldeweg präzisiert: datensparsam (Beteiligte nur soweit nötig), Vertraulichkeit + Schutz vor Vergeltung zugesagt, Security-Verweis auf SECURITY.md.
- Kaputte E-Mail-Widerspruchs-Adresse entfernt: Widerspruch jetzt per Issue-Kommentar / neuem Issue (keine E-Mail im Repo hinterlegt).
- Maintainer-Selbstverpflichtung ergänzt, Ton positiver/aktiver (Erwartetes Verhalten / Nicht akzeptiert / Durchsetzung).
- Verweise vereinheitlicht, Prettier-konform (proseWrap never).

## Testergebnis
- `npx prettier --check CODE_OF_CONDUCT.md`: OK
- `pytest tests/test_unit.py -m unit`: nicht lauffähig (kein .venv, playwright fehlt im System-Python) – keine Code-Änderung, nur Markdown, kein Risiko.

## Offene Punkte
- Falls privater Meldekanal (E-Mail) gewünscht, Adresse in SECURITY.md + CoC nachtragen.
- Optional: README „Mitwirken" auf CoC verlinken.
