#!/usr/bin/env bash
# source: scripts/codesign-setup.sh
# Erstellt ein **selbstsigniertes Dev-Zertifikat** für Windows-Code-Signing.
#
# WICHTIG: Nur für lokale Tests geeignet — SmartScreen wird trotzdem warnen.
# Für Release: echtes Authenticode-Zertifikat (OV/EV) besorgen und als
# Umgebungsvariablen WIN_CSC_LINK + CSC_KEY_PASSWORD setzen (Vorrang in
# scripts/codesign-env.sh).
set -euo pipefail

CERTDIR="${CODESIGN_CERTDIR:-$HOME/.config/oidarwave/codesign}"
mkdir -p "$CERTDIR"

if [ -f "$CERTDIR/oidarwave-dev.pfx" ]; then
  echo "Zertifikat existiert bereits: $CERTDIR/oidarwave-dev.pfx — überspringe Generierung."
  exit 0
fi

NUM_DAYS="${CODESIGN_DAYS:-3650}"
openssl req -x509 -newkey rsa:4096 -sha256 -days "$NUM_DAYS" -nodes \
  -keyout "$CERTDIR/oidarwave-dev.key" \
  -out "$CERTDIR/oidarwave-dev.cer" \
  -subj "/CN=Oidarwave Development/O=Oidarwave/C=DE" \
  -addext "extendedKeyUsage=critical,codeSigning"

openssl rand -base64 32 | tr -d '\n' > "$CERTDIR/passphrase"
chmod 600 "$CERTDIR/passphrase" "$CERTDIR/oidarwave-dev.key"

PASS="$(cat "$CERTDIR/passphrase")"
openssl pkcs12 -export \
  -inkey "$CERTDIR/oidarwave-dev.key" \
  -in "$CERTDIR/oidarwave-dev.cer" \
  -out "$CERTDIR/oidarwave-dev.pfx" \
  -passout "pass:$PASS" \
  -name "Oidarwave Development"

echo "Dev-Zertifikat erstellt in $CERTDIR (gültig $NUM_DAYS Tage, CN=Oidarwave Development)."
echo "Wird automatisch von 'npm run dist:win:signed' verwendet."
