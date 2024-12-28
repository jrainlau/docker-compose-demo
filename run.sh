#!/bin/bash

docker-compose down --rmi all --volumes --remove-orphans

base_dir=$(dirname "$(realpath "$0")")
directories=("backend" "frontend" "nginx")

# Loop through each directory and build the Docker image
for dir in "${directories[@]}"; do
  cd "$base_dir/$dir" || exit
  docker build -t "my-${dir}" .
done

docker-compose up -d
docker container prune -f
