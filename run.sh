#!/bin/bash

docker-compose down --rmi all --volumes --remove-orphans
docker-compose up
docker container prune -f
