#!/usr/bin/env bash
#
# Pulls the newest olum.video frontend image and restarts its container.
#
# Install at /opt/olum/deploy-video-frontend.sh on the EC2 instance. The CI
# job (.github/workflows/build-deploy.yml) invokes it over SSM after pushing a
# new image to ECR. Mirrors the existing /opt/olum/deploy-frontend.sh.
#
#   sudo install -m 755 deploy-video-frontend.sh /opt/olum/
#
set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/opt/olum}"
SERVICE="video_frontend"

cd "$COMPOSE_DIR"

# Authenticate to ECR. The instance role must allow ecr:GetAuthorizationToken.
REGION="${AWS_REGION:-us-east-1}"
REGISTRY="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${REGION}.amazonaws.com"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "Pulling ${SERVICE}…"
docker compose pull "$SERVICE"

# --no-deps so restarting the frontend cannot take its network peers with it.
echo "Restarting ${SERVICE}…"
docker compose up -d --no-deps "$SERVICE"

# Wait for the container's own healthcheck rather than assuming success. A
# deploy that "finished" while serving 502s is worse than one that failed
# loudly, because nobody goes looking.
echo "Waiting for health…"
for i in $(seq 1 30); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$SERVICE" 2>/dev/null || echo starting)"
  if [ "$status" = "healthy" ]; then
    echo "${SERVICE} is healthy."
    docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 2
done

echo "ERROR: ${SERVICE} did not become healthy. Recent logs:" >&2
docker compose logs --tail 50 "$SERVICE" >&2
exit 1
