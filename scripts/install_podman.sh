#!/usr/bin/env bash
set -euo pipefail

# install_podman.sh
# Idempotent installer for Podman on Debian/Raspberry Pi OS
# Places apt keyring and repo for libcontainers if needed, installs podman,
# and enables user socket for the 'pi' user if present.

QUIET=0
usage(){
  cat <<EOF
Usage: sudo ./install_podman.sh
Installs Podman on Debian/Raspberry Pi OS. Run as root (sudo).
Options:
  -q   Quiet (less output)
  -h   Show this help
EOF
}

while getopts ":qh" opt; do
  case "$opt" in
    q) QUIET=1 ;;
    h) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done

if [ "$EUID" -ne 0 ]; then
  echo "This script must be run with sudo or as root." >&2
  exit 1
fi

echo "==> Podman installer started"

# Basic deps
if [ $QUIET -eq 0 ]; then
  echo "Installing prerequisite packages..."
fi
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates curl gnupg2 apt-transport-https

# Detect OS codename
if [ -r /etc/os-release ]; then
  . /etc/os-release
  CODENAME="${VERSION_CODENAME:-}" || CODENAME=""
fi
if [ -z "$CODENAME" ]; then
  # fallback to lsb_release
  if command -v lsb_release >/dev/null 2>&1; then
    CODENAME=$(lsb_release -cs)
  fi
fi
if [ -z "$CODENAME" ]; then
  echo "Cannot detect OS codename (e.g. bullseye/bookworm). Aborting." >&2
  exit 2
fi

ARCH=$(uname -m)
echo "Detected OS codename: $CODENAME, arch: $ARCH"

# Try simple install first
if apt-cache policy podman | grep -q 'Installed:'; then
  echo "Podman package already present in apt cache. Installing..."
  apt-get update -y
  apt-get install -y podman || true
fi

if command -v podman >/dev/null 2>&1; then
  echo "Podman is already installed: $(podman --version)"
else
  echo "Podman not found via apt. Adding libcontainers repository for Debian ${CODENAME}..."
  mkdir -p /etc/apt/keyrings
  KEYRING=/etc/apt/keyrings/libcontainers-archive-keyring.gpg
  REPO_LIST=/etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list

  if [ ! -f "$KEYRING" ]; then
    curl -fsSL "https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/Debian_${CODENAME}/Release.key" \
      | gpg --dearmor -o "$KEYRING"
  else
    [ $QUIET -eq 0 ] && echo "Keyring already exists at $KEYRING"
  fi

  if [ ! -f "$REPO_LIST" ]; then
    echo "deb [signed-by=${KEYRING}] https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/Debian_${CODENAME}/ /" \
      > "$REPO_LIST"
  else
    [ $QUIET -eq 0 ] && echo "Repo list already exists at $REPO_LIST"
  fi

  apt-get update -y
  apt-get install -y podman || {
    echo "apt install podman failed. Please inspect apt output above." >&2
    exit 3
  }
fi

echo "Podman version: $(podman --version || true)"

# Enable podman.socket for user 'pi' if present
if id -u pi >/dev/null 2>&1; then
  echo "Enabling podman user service for 'pi' (socket activation)..."
  # enable linger to permit user services after logout
  loginctl enable-linger pi || true
  # enable socket for the user
  su - pi -c 'systemctl --user enable --now podman.socket' || true
  echo "You can test a run as user 'pi': su - pi -c 'podman run --rm docker.io/library/alpine:latest echo hello'"
else
  echo "User 'pi' not found on this system; skipping user socket enable." 
fi

echo "==> Podman install completed. Run 'podman info' and 'podman run' to validate." 
exit 0
