#!/bin/bash
#
# Open MDB — first-boot hook (BETA).
#
# This file is copied to the SD card's boot drive together with open-mdb.txt.
# It runs once, very early on the Pi's first boot, and its only job is to
# install a provisioning service that finishes the setup after the network
# is up. Full walkthrough: docs/04a-setup-without-terminal.md
#
# It is triggered by adding this to the end of the single line in cmdline.txt:
#   systemd.run=/boot/firstrun-openmdb.sh systemd.run_success_action=reboot systemd.unit=kernel-command-line.target
#
set +e

BOOT_DIR="/boot"
[ -d /boot/firmware ] && [ -f /boot/firmware/cmdline.txt ] && BOOT_DIR="/boot/firmware"

# ---- the provisioning script that runs on the NEXT boot, with network ----
cat > /usr/local/sbin/open-mdb-provision.sh <<'PROVISION'
#!/bin/bash
# Open MDB provisioning — runs once, after the network is online.
set +e

BOOT_DIR="/boot"
[ -d /boot/firmware ] && BOOT_DIR="/boot/firmware"
LOG="${BOOT_DIR}/open-mdb-setup.log"
CFG="${BOOT_DIR}/open-mdb.txt"

log() { echo "$(date '+%H:%M:%S') $*" >> "${LOG}"; }

echo "Open MDB setup log — $(date)" > "${LOG}"

if [ ! -f "${CFG}" ]; then
  log "FAILED: open-mdb.txt not found on the boot drive. Copy it and reboot."
  exit 0
fi

# Read settings (only the keys we expect; ignore comments/blank lines)
MACHINE_ID=$(sed -n 's/^MACHINE_ID=//p' "${CFG}" | tail -1 | tr -d '\r')
INGEST_URL=$(sed -n 's/^INGEST_URL=//p' "${CFG}" | tail -1 | tr -d '\r')
INGEST_SECRET=$(sed -n 's/^INGEST_SECRET=//p' "${CFG}" | tail -1 | tr -d '\r')
SERIAL_DEVICE=$(sed -n 's/^SERIAL_DEVICE=//p' "${CFG}" | tail -1 | tr -d '\r')
SERIAL_DEVICE=${SERIAL_DEVICE:-/dev/ttyAMA0}

if [ -z "${MACHINE_ID}" ] || [ -z "${INGEST_URL}" ] || [ -z "${INGEST_SECRET}" ]; then
  log "FAILED: open-mdb.txt is missing MACHINE_ID, INGEST_URL, or INGEST_SECRET."
  log "Edit the file on the SD card and reboot the Pi."
  exit 0
fi
case "${INGEST_URL}" in
  *YOUR-ACCOUNT*|*example*) log "FAILED: INGEST_URL still has the placeholder value. Edit open-mdb.txt."; exit 0;;
esac
log "Settings OK: MACHINE_ID=${MACHINE_ID}"

# Wait for the network (up to 5 minutes)
for i in $(seq 1 60); do
  if ping -c1 -W2 github.com >/dev/null 2>&1; then break; fi
  sleep 5
done
if ! ping -c1 -W2 github.com >/dev/null 2>&1; then
  log "FAILED: no internet after 5 minutes. Check the Wi-Fi settings you"
  log "entered in Raspberry Pi Imager, then reboot the Pi to retry."
  exit 0
fi
log "Network is up."

log "Installing packages..."
apt-get update -qq >> "${LOG}" 2>&1
apt-get install -y -qq python3-pip python3-venv git >> "${LOG}" 2>&1

log "Enabling the serial port..."
if command -v raspi-config >/dev/null; then
  raspi-config nonint do_serial_hw 0 >> "${LOG}" 2>&1
  raspi-config nonint do_serial_cons 1 >> "${LOG}" 2>&1
fi

log "Downloading Open MDB..."
rm -rf /opt/open-mdb
git clone --depth 1 https://github.com/charlesonogwu/Open-MDB.git /opt/open-mdb >> "${LOG}" 2>&1 \
  || { log "FAILED: could not download the code. Reboot to retry."; exit 0; }

log "Setting up the listener..."
LDIR=/opt/open-mdb/reference/pi-listener-python
python3 -m venv "${LDIR}/.venv" >> "${LOG}" 2>&1
"${LDIR}/.venv/bin/pip" install -q -r "${LDIR}/requirements.txt" >> "${LOG}" 2>&1 \
  || { log "FAILED: python packages did not install. Reboot to retry."; exit 0; }

id -u openmdb >/dev/null 2>&1 || useradd --system --home-dir /opt/open-mdb --groups dialout openmdb
cat > "${LDIR}/.env" <<ENV
MACHINE_ID=${MACHINE_ID}
SERIAL_DEVICE=${SERIAL_DEVICE}
INGEST_URL=${INGEST_URL}
INGEST_SECRET=${INGEST_SECRET}
ENV
chown -R openmdb:openmdb /opt/open-mdb
chmod 600 "${LDIR}/.env"

cat > /etc/systemd/system/open-mdb-listener.service <<UNIT
[Unit]
Description=Open MDB vend listener
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=openmdb
WorkingDirectory=${LDIR}
EnvironmentFile=${LDIR}/.env
ExecStart=${LDIR}/.venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable open-mdb-listener >> "${LOG}" 2>&1
systemctl start open-mdb-listener

# Run once only
systemctl disable open-mdb-provision.service >> "${LOG}" 2>&1

sleep 5
if systemctl is-active --quiet open-mdb-listener; then
  log "SUCCESS: the Open MDB listener is installed and running."
  log "It will start automatically every time the Pi powers on."
else
  log "Installed, but the listener is not running yet. If the Pi is not"
  log "wired to the machine yet, that can be normal (no serial device)."
  log "Wire the machine (docs/03), power-cycle, then check this log again."
fi
exit 0
PROVISION
chmod +x /usr/local/sbin/open-mdb-provision.sh

# ---- service that triggers the provisioning after network is up ----
cat > /etc/systemd/system/open-mdb-provision.service <<'UNIT'
[Unit]
Description=Open MDB one-time provisioning
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/open-mdb-provision.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
UNIT
ln -sf /etc/systemd/system/open-mdb-provision.service \
  /etc/systemd/system/multi-user.target.wants/open-mdb-provision.service

# ---- clean our trigger out of cmdline.txt (so this never runs again) ----
sed -i 's| systemd.run=[^ ]*firstrun-openmdb.sh||; s| systemd.run_success_action=reboot||; s| systemd.unit=kernel-command-line.target||' "${BOOT_DIR}/cmdline.txt"
rm -f "${BOOT_DIR}/firstrun-openmdb.sh"

exit 0
