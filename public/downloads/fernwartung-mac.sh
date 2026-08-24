#!/bin/bash
#
#  Fernwartung Infraone – Einrichtung für macOS
#  ---------------------------------------------------------------
#  Installiert RustDesk und verbindet es automatisch mit dem
#  Fernwartungsserver von Infraone IT Solutions.
#
#  Nichts wird ohne Ihr Zutun freigegeben: Der Techniker kann sich
#  erst verbinden, wenn Sie ihm Ihre ID und das Kennwort mitteilen.
#
#  Version:  1.0  (RustDesk 1.4.6)
#  Kontakt:  Infraone IT Solutions
#

set -u

# ----------------------------------------------------------------------
#  Konfiguration – muss mit dem Windows-Client übereinstimmen
# ----------------------------------------------------------------------
RD_VERSION="1.4.6"
RD_HOST="81.221.10.65"
RD_RELAY="81.221.10.65"
RD_KEY="Fre74OIllmZTWeI7zepFI7hivrx6lCnYCce8pToCJI4="

SHA_AARCH64="0cd498e3f99c878bfa3c54996089b9671fdd15aee5d1ac160444841f95ea01bc"
SHA_X86_64="7d0daf81a80a9861661c0e89321f302760fad9e384247f2c1a9acd9f45705c55"

BASE_URL="https://github.com/rustdesk/rustdesk/releases/download/${RD_VERSION}"
CONFIG_DIR="${HOME}/Library/Preferences/com.carriez.RustDesk"

# ----------------------------------------------------------------------
#  Hilfsfunktionen
# ----------------------------------------------------------------------
BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'; OFF=$'\033[0m'

info()  { printf '%s\n' "  $*"; }
step()  { printf '\n%s\n' "${BOLD}▸ $*${OFF}"; }
ok()    { printf '%s\n' "  ${GREEN}✓${OFF} $*"; }

MOUNT_POINT=""
TMP_DIR=""

cleanup() {
    [ -n "$MOUNT_POINT" ] && [ -d "$MOUNT_POINT" ] && hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null
    [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ] && rm -rf "$TMP_DIR"
}
trap cleanup EXIT

abort() {
    printf '\n%s\n' "${RED}✗ Die Einrichtung wurde abgebrochen:${OFF}"
    printf '%s\n' "  $*"
    printf '\n%s\n\n' "  Bitte melden Sie sich bei Infraone IT Solutions."
    printf '%s' "  Zum Schliessen des Fensters die Eingabetaste drücken … "
    read -r _ 2>/dev/null || true
    exit 1
}

# ----------------------------------------------------------------------
#  Start
# ----------------------------------------------------------------------
clear 2>/dev/null || true
cat <<'BANNER'

  ══════════════════════════════════════════════════════════
     F E R N W A R T U N G   ·   I N F R A O N E
     Einrichtung für macOS
  ══════════════════════════════════════════════════════════

BANNER

[ "$(uname -s)" = "Darwin" ] || abort "Dieses Programm läuft nur auf einem Mac."

# --- 1. Prozessortyp bestimmen ----------------------------------------
step "Mac wird geprüft"

if [ "$(sysctl -n hw.optional.arm64 2>/dev/null || echo 0)" = "1" ]; then
    ARCH="aarch64"; SHA_EXPECTED="$SHA_AARCH64"; CHIP="Apple Silicon"
else
    ARCH="x86_64";  SHA_EXPECTED="$SHA_X86_64";  CHIP="Intel"
fi

info "macOS $(sw_vers -productVersion 2>/dev/null || echo '?') · ${CHIP}"

# --- 2. Laufendes RustDesk beenden ------------------------------------
if pgrep -x RustDesk >/dev/null 2>&1; then
    step "Laufende Sitzung wird beendet"
    osascript -e 'quit app "RustDesk"' 2>/dev/null
    sleep 2
    pkill -x RustDesk 2>/dev/null
    sleep 1
    ok "beendet"
fi

# --- 3. Download -------------------------------------------------------
step "Fernwartungs-Software wird heruntergeladen"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/infraone-fernwartung.XXXXXX")" || abort "Temporärer Ordner konnte nicht erstellt werden."
DMG="${TMP_DIR}/rustdesk-${RD_VERSION}-${ARCH}.dmg"

info "${DIM}rustdesk-${RD_VERSION}-${ARCH}.dmg${OFF}"
if ! curl -fL --progress-bar --retry 3 --retry-delay 2 \
        -o "$DMG" "${BASE_URL}/rustdesk-${RD_VERSION}-${ARCH}.dmg"; then
    abort "Der Download ist fehlgeschlagen. Bitte Internetverbindung prüfen."
fi

# --- 4. Integrität prüfen ---------------------------------------------
step "Download wird auf Echtheit geprüft"

SHA_ACTUAL="$(shasum -a 256 "$DMG" | awk '{print $1}')"
if [ "$SHA_ACTUAL" != "$SHA_EXPECTED" ]; then
    abort "Die Prüfsumme stimmt nicht überein – die Datei wurde unterwegs verändert."
fi
ok "Prüfsumme korrekt"

# --- 5. Installieren ---------------------------------------------------
step "Software wird installiert"

MOUNT_POINT="${TMP_DIR}/mnt"
mkdir -p "$MOUNT_POINT"
hdiutil attach "$DMG" -mountpoint "$MOUNT_POINT" -nobrowse -quiet -noverify \
    || abort "Das Installationsabbild konnte nicht geöffnet werden."

SRC_APP="${MOUNT_POINT}/RustDesk.app"
[ -d "$SRC_APP" ] || abort "Im Installationsabbild wurde keine Anwendung gefunden."

if [ -w /Applications ]; then
    DEST_DIR="/Applications"
    SUDO=""
elif mkdir -p "${HOME}/Applications" 2>/dev/null; then
    DEST_DIR="${HOME}/Applications"
    SUDO=""
    info "${DIM}Installation in Ihren persönlichen Programme-Ordner${OFF}"
else
    DEST_DIR="/Applications"
    SUDO="sudo"
    info "Für die Installation wird Ihr Mac-Kennwort benötigt:"
fi

DEST_APP="${DEST_DIR}/RustDesk.app"
[ -d "$DEST_APP" ] && $SUDO rm -rf "$DEST_APP"
$SUDO ditto "$SRC_APP" "$DEST_APP" || abort "Die Anwendung konnte nicht nach ${DEST_DIR} kopiert werden."

hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null
MOUNT_POINT=""

$SUDO xattr -dr com.apple.quarantine "$DEST_APP" 2>/dev/null || true
ok "installiert unter ${DEST_DIR}"

# --- 6. Verbindung zu Infraone hinterlegen ----------------------------
step "Verbindung zu Infraone wird hinterlegt"

mkdir -p "$CONFIG_DIR" || abort "Der Einstellungsordner konnte nicht erstellt werden."

if [ -f "${CONFIG_DIR}/RustDesk2.toml" ]; then
    cp -f "${CONFIG_DIR}/RustDesk2.toml" "${CONFIG_DIR}/RustDesk2.toml.bak" 2>/dev/null || true
fi

cat > "${CONFIG_DIR}/RustDesk2.toml" <<EOF
[options]
custom-rendezvous-server = '${RD_HOST}'
relay-server = '${RD_RELAY}'
key = '${RD_KEY}'
EOF

chmod 600 "${CONFIG_DIR}/RustDesk2.toml"
ok "Server ${RD_HOST} hinterlegt"

# --- 7. Starten --------------------------------------------------------
step "Fernwartung wird gestartet"
open -a "$DEST_APP" || abort "Die Anwendung konnte nicht gestartet werden."
ok "gestartet"

# --- 8. Abschluss ------------------------------------------------------
cat <<'DONE'

  ══════════════════════════════════════════════════════════
     FERTIG – die Fernwartung ist eingerichtet.
  ══════════════════════════════════════════════════════════

  SO GEHT ES WEITER
  -----------------
  1. Im Fenster "RustDesk" sehen Sie oben Ihre ID und ein
     Kennwort. Teilen Sie beides Ihrem Infraone-Techniker mit
     (Telefon oder E-Mail).

  2. macOS fragt beim ersten Mal nach Berechtigungen. In der
     Anwendung erscheinen dafür rote Hinweisfelder – bitte
     jeweils anklicken und im Systemdialog erlauben:

        • Bildschirmaufnahme   (Bild übertragen)
        • Bedienungshilfen     (Maus und Tastatur)

     Danach die Anwendung einmal schliessen und neu starten.

  3. Erst wenn Sie ID und Kennwort weitergeben, kann sich ein
     Techniker verbinden. Ohne diese Angaben ist kein Zugriff
     möglich. Das Kennwort ändert sich bei jedem Neustart.

  Fragen? Infraone IT Solutions hilft gerne weiter.

DONE

printf '%s' "  Zum Schliessen des Fensters die Eingabetaste drücken … "
read -r _ 2>/dev/null || true
exit 0
