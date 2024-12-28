# Docker compose learning

Learn how to use Docker Compose to run multiple Docker containers and combine them together.

## How to run?
```bash
./run.sh
```

## Backend
Using `bun` and `Elysia` to create a backend server. Listening on port 8080.

## Frontend
Using `bun` and `React` to create a frontend page. Listening on port 3000.

## Nginx
Using `nginx` to route requests from different paths to either the `backend` or `frontend`.
