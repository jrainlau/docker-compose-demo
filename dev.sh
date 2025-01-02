#!/bin/bash

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: $COMPOSE_FILE not found."
  exit 1
fi

docker-compose -f "$COMPOSE_FILE" down --rmi local --volumes --remove-orphans
docker-compose -f "$COMPOSE_FILE" up
docker container prune -f