#!/usr/bin/env bash
# source: scripts/codesign-env.sh
# Lädt die Code-Signing-Umgebungsvariablen für electron-builder (Windows).
#
# Zertifikat liegt außerhalb des Repos (~/.config/oidarwave/codesign), damit
# keine Secrets committed werden. Erstellt mit scripts/codesign-setup.sh.
#
# Bereits gesetzte Variablen (z. B. echtes Zertifikat für Release) haben Vorrang.
# POSIX-kompatibel: npm führt Scripts mit /bin/sh aus (pipefail gibt es dort nicht).
set -eu

CERTDIR="${CODESIGN_CERTDIR:-$HOME/.config/oidarwave/codesign}"
export WIN_CSC_LINK="${WIN_CSC_LINK:-$CERTDIR/oidarwave-dev.pfx}"
if [ -z "${CSC_KEY_PASSWORD:-}" ]; then
  CSC_KEY_PASSWORD="$(cat "$CERTDIR/passphrase")"
  export CSC_KEY_PASSWORD
fi

# Kleine Plausibilitätsprüfung, damit npmnicht mit halben Infos startet.
if [ ! -f "$WIN_CSC_LINK" ]; then
  echo "codesign-env.sh: Zertifikat fehlt: $WIN_CSC_LINK" >&2
  echo " Erst einmal ausführen: bash scripts/codesign-setup.sh" >&2
  exit 1
fi

# Das gebündelte osslsigncode (OpenSSL 1.1) liest die System-openssl.cnf
# (OpenSSL 3: Provider-Direktiven) und gibt DSO-Warnungen aus. Leere Config
# unterbindet das; das Signieren selbst ist davon nicht betroffen.
export OPENSSL_CONF=/dev/null
