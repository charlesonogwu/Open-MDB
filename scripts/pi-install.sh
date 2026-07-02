#!/usr/bin/env bash
#
# Open MDB — one-command Raspberry Pi installer.
#
# Sets up everything docs/04-raspberry-pi-setup.md describes by hand:
# system packages, UART, the listener + Python environment, your settings,
# and a systemd service so the listener survives reboots.
#
# Run on the Pi (as your normal user, not root):
#
#   curl -sSL https://raw.githubusercontent.com/charlesonogwu/Open-MDB/main/scripts/pi-install.sh | bash
#
# Or, if you've already cloned the repo:
#
#   bash scripts/pi-install.sh
#
set -euo pipefail

REPO_URL="https://github.com/charlesonogwu/Open-MDB.git"
INSTALL_DIR="${HOME}/open-mdb"
LISTENER_DIR="${INSTALL_DIR}/reference/pi-listener-python"
SERVICE_NAME="open-mdb-listener"

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m  ! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] && die "Run as your normal user, not root/sudo. The script uses sudo only where needed."
command -v sudo >/dev/null || die "sudo is required."

say "Open MDB Pi installer"
echo "This will install the vend listener on this Pi and start it on every boot."
echo "You'll be asked 3 questions (machine name, ingest URL, ingest secret)."

# ---------- 1. system packages ----------
say "Installing system packages (python, git)..."
sudo apt-get update -qq
sudo apt-get install -y -qq python3-pip python3-venv git

# ---------- 2. UART for the Qibixx HAT ----------
NEEDS_REBOOT=0
if command -v raspi-config >/dev/null; then
  say "Enabling the serial port the Qibixx HAT uses..."
  sudo raspi-config nonint do_serial_hw 0    # enable serial hardware
  sudo raspi-config nonint do_serial_cons 1  # disable serial console
  if [ ! -e /dev/ttyAMA0 ]; then
    NEEDS_REBOOT=1
    warn "Serial device not active yet — a reboot at the end will fix that."
  fi
else
  warn "raspi-config not found (not Raspberry Pi OS?). Enable the UART manually — see docs/04."
fi

# ---------- 3. get the code ----------
if [ -f "${LISTENER_DIR}/main.py" ]; then
  say "Using existing checkout at ${INSTALL_DIR}"
elif [ -d "${INSTALL_DIR}/.git" ]; then
  say "Updating existing checkout at ${INSTALL_DIR}..."
  git -C "${INSTALL_DIR}" pull --ff-only
else
  say "Downloading Open MDB to ${INSTALL_DIR}..."
  git clone --depth 1 "${REPO_URL}" "${INSTALL_DIR}"
fi

# ---------- 4. python environment ----------
say "Setting up the listener's Python environment..."
cd "${LISTENER_DIR}"
python3 -m venv .venv
./.venv/bin/pip install -q -r requirements.txt

# ---------- 5. settings ----------
if [ -f .env ]; then
  say "Keeping your existing .env settings (delete ${LISTENER_DIR}/.env and re-run to change them)."
else
  say "A few questions about your setup:"
  read -r -p "  Machine name (shows up on the dashboard, e.g. OFFICE-1): " MACHINE_ID </dev/tty
  read -r -p "  Ingest URL (from 'wrangler deploy', ends in /vends): " INGEST_URL </dev/tty
  read -r -p "  Ingest secret (the same one you set on the Worker): " INGEST_SECRET </dev/tty
  [ -n "${MACHINE_ID}" ] && [ -n "${INGEST_URL}" ] && [ -n "${INGEST_SECRET}" ] || die "All three answers are required. Re-run the script."
  cat > .env <<ENV
MACHINE_ID=${MACHINE_ID}
SERIAL_DEVICE=/dev/ttyAMA0
INGEST_URL=${INGEST_URL}
INGEST_SECRET=${INGEST_SECRET}
ENV
  chmod 600 .env
fi

# ---------- 6. systemd service (paths adapted to this user) ----------
say "Installing the ${SERVICE_NAME} service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service >/dev/null <<UNIT
[Unit]
Description=Open MDB vend listener
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${LISTENER_DIR}
EnvironmentFile=${LISTENER_DIR}/.env
ExecStart=${LISTENER_DIR}/.venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME} >/dev/null

if [ "${NEEDS_REBOOT}" -eq 1 ]; then
  say "Done — one reboot needed to activate the serial port."
  echo "Run:  sudo reboot"
  echo "The listener starts automatically after the reboot."
else
  sudo systemctl restart ${SERVICE_NAME}
  say "Done — the listener is running."
fi

echo
echo "Useful commands:"
echo "  sudo systemctl status ${SERVICE_NAME}     # is it running?"
echo "  sudo journalctl -u ${SERVICE_NAME} -f     # watch it live"
echo "  cd ${LISTENER_DIR} && ./.venv/bin/python main.py --simulate   # fake vends to test the pipeline"
