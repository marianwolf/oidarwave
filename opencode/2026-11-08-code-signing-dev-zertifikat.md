# Session: Windows Code Signing (Dev-Zertifikat) eingerichtet

**Datum:** 2026-11-08

## Ziel

Windows-Builds mit Authenticode-Signatur versehen (`no code signing certificate configured` beseitigen). Nutzerentscheidung: **selbstsigniertes Dev-Zertifikat zum Testen** — echtes OV/EV-Zertifikat bleibt für Release offen.

## Geänderte Dateien

- `package.json`: neues Script `dist:win:signed`; `build.toolsets.winCodeSign = "1.1.0"` (Legacy-Bundle 2.6.0 braucht libssl1.1, das Ubuntu 24.04 nicht mehr hat).
- `scripts/codesign-setup.sh` (neu): erzeugt selbstsigniertes Code-Signing-Zertifikat (RSA 4096, 10 Jahre, EKU CodeSigning) unter `~/.config/oidarwave/codesign/` — **kein Secret im Repo**.
- `scripts/codesign-env.sh` (neu): lädt `WIN_CSC_LINK` + `CSC_KEY_PASSWORD` aus dem Zertifikatsverzeichnis; echte Zertifikate per Umgebungsvariable haben Vorrang; setzt `OPENSSL_CONF=/dev/null` (cosmetische DSO-Warnungen des gebündelten OpenSSL-1.1-binaries).
- `opencode/2026-11-08-windows-dist-builder-setup.md`: Formatiert (prettier).

## Ablauf / Fallstricke

1. `bash scripts/...` in einem npm-Script läuft im Kindprozess → `export`s verlieren. Fix: `. scripts/codesign-env.sh` (source).
2. npm-Scripts laufen mit POSIX-`sh` → `set -o pipefail` nicht verfügbar. Fix: `set -eu`.
3. Gemündeltes osslsigncode (2.6.0 und 1.1.0) linkt gegen `libcrypto.so.1.1`. Workaround ohne sudo: Focal-DEB `libssl1.1_1.1.1f` per `dpkg-deb -x` entpackt und `libcrypto.so.1.1`/`libssl.so.1.1` nach `~/.cache/electron-builder/win-codesign@1.1.0/win-codesign-linux-amd64-*/lib/` kopiert. electron-builder-Wrapper setzt `LD_LIBRARY_PATH` automatisch.
4. Auf Linux signiert electron-builder **osslsigncode**, nicht signtool/Wine — Wine-Trust-Store nicht nötig.

## Ergebnis

`npm run dist:win:signed` signiert alles (`signing`-Logzeilen statt `signing is skipped`):

- `dist/win-unpacked/Oidarwave.exe` (x64, Portable) — signiert
- `dist/win-arm64-unpacked/Oidarwave.exe` (arm64, Portable) — signiert
- `dist/Oidarwave Setup 0.9.18.exe` (NSIS-Installer, x64+arm64) — signiert inkl. elevate.exe/Uninstaller
- Signatur verifiziert mit `osslsigncode verify`: Subject `CN=Oidarwave Development`, DigiCert-RFC3161-Timestamp.

## Testergebnis

- `pytest tests/test_unit.py -m unit`: **11 passed, 1 xfailed** (erwartetes PreBuild-Rotlicht `test_no_secrets_in_station_urls` unberührt).
- `npm run format`: eine Datei (Summary) formatiert.

## `npm run format` ausgeführt?

Ja.

## Offene Punkte

- **Selbstsigniert = nur Test!** SmartScreen zeigt Windows-Nutzern weiterhin Warnung ("Unbekannter Herausgeber"); das Dev-Zertifikat ist nicht in jedem Windows-Trust-Store.
- Für Release: echtes OV/EV-Zertifikat besorgen und als `WIN_CSC_LINK`+`CSC_KEY_PASSWORD` env-Variablen setzen (Vorrang im Loader) — Konfiguration läuft dann ohne Code-Änderung.
- `libssl1.1`-Workaround liegt nur im Build-Cache (`~/.cache`); bei Cache-Lösung evtl. erneut nötig, per `dpkg-deb -x` zu wiederholen.
