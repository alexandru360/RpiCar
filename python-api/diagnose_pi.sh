#!/bin/bash

# Diagnostic script for RpiCar (run on the Raspberry Pi in project directory)
# Usage:
#   chmod +x diagnose_pi.sh
#   ./diagnose_pi.sh              # writes to ./diagnose_YYYYMMDD-HHMMSS.log
#   ./diagnose_pi.sh out.txt      # writes to out.txt

OUTFILE="$1"
if [ -z "$OUTFILE" ]; then
  TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
  OUTFILE="diagnose_${TIMESTAMP}.log"
fi

exec >"$OUTFILE" 2>&1

echo "===== RpiCar Diagnostic Script ====="
echo "DATE: $(date)"
echo "USER: $(whoami)"
echo "HOSTNAME: $(hostname)"

echo "\n--- OS / Kernel ---"
uname -a
cat /etc/os-release 2>/dev/null || true

echo "\n--- IP addresses ---"
ip -4 addr show || ip addr show

echo "\n--- Host routes ---"
ip route || true

echo "\n--- Listening TCP ports ---"
ss -ltnp 2>/dev/null | sed -n '1,200p' || (netstat -ltnp 2>/dev/null | sed -n '1,200p') || true

echo "\n--- Listening UDP ports ---"
ss -lunp 2>/dev/null | sed -n '1,200p' || true

echo "\n--- Processes related to pigpio/pigpiod ---"
ps aux | grep -E 'pigpiod|pigpio' | grep -v grep || true

echo "\n--- pigpiod systemd status ---"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl status pigpiod --no-pager || true
else
  echo "systemctl not available"
fi

echo "\n--- Python environment and imports check (venv if present) ---"
if [ -d "env" ]; then
  echo "Found virtualenv: env"
  . env/bin/activate || true
  python3 -c "import sys; print('python', sys.version)" 2>&1 || true
  python3 - <<'PY'
try:
    import RPi.GPIO, pigpio, cv2
    print('Imports OK: RPi.GPIO, pigpio, cv2')
except Exception as e:
    print('Import error:', e)
PY
  deactivate >/dev/null 2>&1 || true
else
  echo "No virtualenv 'env' found in this folder"
  python3 -c "import sys; print('python', sys.version)" 2>&1 || true
  python3 - <<'PY'
try:
    import RPi.GPIO, pigpio, cv2
    print('Imports OK: RPi.GPIO, pigpio, cv2')
except Exception as e:
    print('Import error:', e)
PY
fi

echo "\n--- run_car / Flask processes ---"
ps aux | grep run_car.py | grep -v grep || true
ps aux | grep '[p]ython3' | grep -E 'run_car|flask' || true

echo "\n--- Check for run_car.py process and try to start it briefly (no-op if already running) ---"
if [ -f "run_car.py" ]; then
  echo "run_car.py found in $(pwd)"
  # show last run_car log if exists
  if [ -f run_car_out.log ]; then
    echo "\n--- Last 200 lines of run_car_out.log ---"
    tail -n 200 run_car_out.log || true
  fi
else
  echo "run_car.py NOT found in current folder: $(pwd)"
fi

echo "\n--- systemd units that mention run_car or rpi_car ---"
if command -v systemctl >/dev/null 2>&1; then
  sudo grep -R --line-number "run_car\|rpi_car" /etc/systemd/system /lib/systemd/system /etc/systemd/system 2>/dev/null || true
  sudo systemctl list-units --type=service | grep -E 'rpi_car|run_car' || true
fi

echo "\n--- Grep common autostart locations for run_car references ---"
sudo grep -R --line-number "run_car.sh\|run_car.py\|rpi_car" /etc/init.d /etc/cron* /home/pi /etc/systemd/system 2>/dev/null || true

echo "\n--- Firewall (ufw) status (if present) ---"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status verbose || true
else
  echo "ufw not installed"
fi

echo "\n--- iptables rules (filter table) ---"
sudo iptables -L -n -v || true

echo "\n--- Recent journal entries for rpi_car (if unit exists) ---"
if command -v journalctl >/dev/null 2>&1; then
  sudo journalctl -u rpi_car.service -n 200 --no-pager || true
fi

echo "\n--- End of diagnostics. Log written to: $OUTFILE ---"

echo
echo "To retrieve the log from this machine, run from your PC:"
echo "scp pi@<IP>:$OUTFILE ./"

exit 0
