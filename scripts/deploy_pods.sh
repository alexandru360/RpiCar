#!/usr/bin/env bash
set -euo pipefail

# deploy_pods.sh
# Pull images from registry and create Podman pods for python-api and nginx
# Usage:
#   sudo ./deploy_pods.sh <GHCR_REPO_PREFIX>
# Example:
#   sudo ./deploy_pods.sh ghcr.io/youruser/rpicar

if [ "$EUID" -ne 0 ]; then
  echo "This script should be run as root (sudo) so Podman can create pods and map devices." >&2
  exit 1
fi

GHCR_PREFIX=${1:-}
if [ -z "$GHCR_PREFIX" ]; then
  echo "Usage: $0 GHCR_PREFIX (eg ghcr.io/<org>/<repo>)" >&2
  exit 2
fi

PY_IMAGE="${GHCR_PREFIX}/python-api:latest"
NGINX_IMAGE="${GHCR_PREFIX}/html:latest"

echo "Using images: $PY_IMAGE and $NGINX_IMAGE"

# create a user network for pod communication (idempotent)
podman network create rpicar-net || true

# Pull images
podman pull "$PY_IMAGE"
podman pull "$NGINX_IMAGE"

### Python pod
echo "Creating python pod and container"
podman pod rm -f python-pod || true
podman pod create --name python-pod --network rpicar-net

# Run python container inside pod with device access to GPIO
# Provide access to /dev/gpiomem (and /dev/serial0 if used) and optionally run privileged if necessary
podman rm -f python-api || true
podman run -d \
  --name python-api \
  --pod python-pod \
  --device /dev/gpiomem:/dev/gpiomem:rwm \
  --device /dev/serial0:/dev/serial0:rwm || true

# If additional permissions needed uncomment privileged line below
#  --privileged \

echo "Starting python container from $PY_IMAGE"
podman run -d \
  --name python-api \
  --pod python-pod \
  --device /dev/gpiomem:/dev/gpiomem:rwm \
  --device /dev/serial0:/dev/serial0:rwm \
  --env PYTHONUNBUFFERED=1 \
  --restart=on-failure \
  "$PY_IMAGE"

### Nginx pod (serves html from image)
echo "Creating nginx pod and container"
podman pod rm -f nginx-pod || true
podman pod create --name nginx-pod --network rpicar-net -p 80:80
podman rm -f nginx || true
podman run -d \
  --name nginx \
  --pod nginx-pod \
  --restart=on-failure \
  "$NGINX_IMAGE"

echo "Pods deployed. python-api is in pod 'python-pod' and nginx in 'nginx-pod'."
echo "Python API will be reachable inside the network at the pod's IP; nginx is published on host port 80."

echo "To inspect containers: podman ps -a"
exit 0
