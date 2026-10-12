# Travel Planner App

## Running PostgreSQL with Docker

The Django backend uses PostgreSQL. The easiest way to run it locally is with the official `postgres` image from Docker Hub.

### 1. Pull the image

```bash
docker pull postgres:16
```

### 2. Start the container

```bash
docker run -d \
  --name travel-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=travel_planner \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

- `POSTGRES_PASSWORD` is required. The container won't start without it.
- `-p 5432:5432` exposes the database at `localhost:5432`.
- `-v pgdata:...` stores data in a named volume, so it survives removing the container.

### 3. Verify it's running

```bash
docker ps
docker logs travel-postgres
```

The logs should end with `database system is ready to accept connections`.

### 4. Connect with psql

```bash
docker exec -it travel-postgres psql -U postgres -d travel_planner
```

### 5. Point the backend at it

`backend/core/settings.py` reads the connection details from environment variables:

```bash
export DB_NAME=travel_planner
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_HOST=localhost   # optional, defaults to localhost
export DB_PORT=5432        # optional, defaults to 5432
```

Then run the migrations:

```bash
cd backend
python manage.py migrate
```

### Everyday commands

| Task | Command |
| --- | --- |
| Stop the database | `docker stop travel-postgres` |
| Start it again | `docker start travel-postgres` |
| Remove the container (keeps data) | `docker rm -f travel-postgres` |
| Delete all data permanently | `docker volume rm pgdata` |

### Troubleshooting

- **Port 5432 already in use** (for example, by a Homebrew Postgres): map a different port with `-p 5433:5432` and set `DB_PORT=5433`.
- **Backend running inside Docker:** `localhost` points at the backend's own container. Set `DB_HOST=host.docker.internal`, or use Docker Compose with `DB_HOST=db` (the service name).

## Running the backend with Docker

The backend has a `Dockerfile` that serves the app with gunicorn on port 8000.

### 1. Build the image

```bash
cd backend
docker build -t travel-backend .
```

### 2. Run the container

```bash
docker run -p 8000:8000 --env-file .env travel-backend
```

- `--env-file .env` passes in the database settings (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, ...).
- If Postgres runs on your machine or in the `travel-postgres` container above, set `DB_HOST=host.docker.internal` in `.env`. Inside the container, `localhost` points at the container itself.

The API is then available at `http://localhost:8000`.
