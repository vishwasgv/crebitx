# Running CREBITX Locally

Three services + two infra containers. Ports:

| Service     | Port | Path                  |
|-------------|------|------------------------|
| Frontend (Next.js)   | 3002 | `crebitx/`            |
| Backend (NestJS)     | 4000 | `crebitx-backend/`    |
| ML Engine (FastAPI)  | 8001 | `ml-engine/`           |
| Postgres             | 5432 | docker container `crebitx-postgres` |
| Redis                | 6379 | docker container `crebitx-redis`    |

> ML engine runs on **8001**, not the default 8000 — port 8000 was occupied by an
> unrelated local process. `crebitx-backend/.env` has `ML_ENGINE_URL` pointing at
> 8001 already; only change it if that port is free and you'd rather use 8000.

---

## Start

Run these in order — each in its own terminal (or background them).

### 1. Infra: Postgres + Redis

```bash
docker start crebitx-postgres crebitx-redis
```

If those containers don't exist yet (fresh machine), create them instead:

```bash
docker run -d --name crebitx-postgres -p 5432:5432 \
  -e POSTGRES_DB=crebitx -e POSTGRES_USER=crebitx_user -e POSTGRES_PASSWORD=crebitx_password \
  postgres:15-alpine

docker run -d --name crebitx-redis -p 6379:6379 redis:7-alpine
```

Verify:
```bash
docker exec crebitx-postgres pg_isready -U crebitx_user
docker exec crebitx-redis redis-cli ping
```

### 2. ML Engine (FastAPI, port 8001)

```bash
cd ml-engine
source venv/bin/activate   # first time: python3 -m venv venv && pip install -r requirements.txt
export DATABASE_URL="postgresql://crebitx_user:crebitx_password@localhost:5432/crebitx?schema=public"
export REDIS_URL="redis://localhost:6379/0"
export ML_API_KEY="crebitx-secret-key-for-dev"
uvicorn main:app --host 0.0.0.0 --port 8001
```

Verify: `curl http://localhost:8001/health` → `{"status":"ok"}`

### 3. Backend (NestJS, port 4000)

```bash
cd crebitx-backend
npm run start:dev
```

Verify: `curl http://localhost:4000/api/v1/health`

### 4. Frontend (Next.js, port 3002)

```bash
cd crebitx
npm run dev
```

Open: http://localhost:3002

---

## Stop

Reverse order. Kill whatever is bound to each port, then stop the containers.

```bash
# Frontend
lsof -ti tcp:3002 | xargs kill

# Backend (also kills stray nest watch/fork-ts-checker helper processes)
lsof -ti tcp:4000 | xargs kill
pkill -f "nest.js start --watch"
pkill -f "fork-ts-checker"

# ML Engine
lsof -ti tcp:8001 | xargs kill

# Infra
docker stop crebitx-postgres crebitx-redis
```

To fully tear down infra (deletes DB data — only if you mean it):
```bash
docker rm -f crebitx-postgres crebitx-redis
```

---

## Notes / gotchas

- **Redis feature cache**: the ML engine caches computed features per customer for 1 hour.
  After changing `ml-engine/modules/*.py`, flush it before re-testing:
  ```bash
  docker exec crebitx-redis redis-cli FLUSHALL
  ```
- **Restarting the backend after an `.env` change**: `nest start --watch` recompiles on
  code changes but does **not** reload env vars — kill and re-run `npm run start:dev`.
- **First-time frontend setup**: this repo uses a `pnpm` lockfile. Use `pnpm install`
  (via `corepack enable`) rather than `npm install` so native/platform binaries
  (e.g. Next's SWC binary) resolve correctly.
- **First-time backend setup**: if `bcrypt` throws a `dlopen`/mach-o error, rebuild it
  for your platform: `npm rebuild bcrypt` (or `rm -rf node_modules/bcrypt && npm install bcrypt --build-from-source`).
- **DB credentials**: both `.env` files (`crebitx/.env`, `crebitx-backend/.env`) must
  point at the same Postgres user/password as whatever actually initialized the
  `crebitx-postgres` volume — check with:
  ```bash
  docker inspect crebitx-postgres --format '{{json .Config.Env}}'
  ```
