# Family Health Vault - API Service

NestJS API service for the Family Health Vault platform.

## Features

- Email sign-up / sign-in
- Social login (Google, Apple) via pluggable identity providers
- Email OTP sign-up / sign-in
- JWT access tokens and secure refresh token rotation
- Device session tracking
- Password reset
- Redis-backed rate limiting with in-memory fallback
- Row-level security (RLS) context for PostgreSQL
- Swagger API documentation
- Health endpoints (`/health/live`, `/health/ready`)
- RFC 7807 `application/problem+json` error responses
- Request-ID propagation via `x-request-id` header

## Architecture

The service follows Clean Architecture:

- `domain/` — entities, repository interfaces, and domain services
- `application/` — DTOs and use-case/application service
- `infrastructure/` — TypeORM, JWT, password hashing, identity providers, rate limiting, RLS, health checks
- `interface/` — HTTP controllers, guards, filters, and decorators

## Local Development

### 1. Start backing services

From the repository root:

```bash
docker-compose up -d
```

This starts PostgreSQL (with `pgvector` and `pg_trgm`), Redis, MinIO, and Mailpit.

### 2. Configure the API

```bash
cp services/api/.env.example services/api/.env
# Edit services/api/.env if your docker-machine host is not localhost
```

### 3. Install and run the API

```bash
cd services/api
npm install
npm run build
npm run start:dev
```

The API will be available at `http://localhost:3000`.

- Swagger UI: `http://localhost:3000/api/docs`
- Health (live): `http://localhost:3000/health/live`
- Health (ready): `http://localhost:3000/health/ready`
- Mailpit UI: `http://localhost:8025`
- MinIO console: `http://localhost:9001` (default creds `minioadmin` / `minioadmin`)

### 4. Run tests

```bash
npm run test
npm run test:e2e
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | `change-me-in-production` |
| `JWT_EXPIRES_IN_SECONDS` | Access token TTL in seconds | `900` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh token TTL in days | `7` |
| `DB_TYPE` | `postgres` or `better-sqlite3` | `postgres` |
| `DATABASE_URL` | Postgres connection string | — |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | Postgres settings | — |
| `DB_DATABASE` | SQLite database path | `:memory:` |
| `REDIS_URL` | Redis connection URL | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `APPLE_CLIENT_ID` | Apple Sign In client ID | — |
| `RATE_LIMIT_POINTS` | Max requests per window | `100` |
| `RATE_LIMIT_DURATION` | Rate limit window in seconds | `60` |

## API Documentation

When the server is running, open `http://localhost:3000/api/docs` for Swagger UI.
