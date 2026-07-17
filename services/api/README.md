# Family Health Vault - API Service

NestJS authentication service for the Family Health Vault platform.

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

## Architecture

The service follows Clean Architecture:

- `domain/` — entities, repository interfaces, and domain services
- `application/` — DTOs and use-case/application service
- `infrastructure/` — TypeORM, JWT, password hashing, identity providers, rate limiting, RLS
- `interface/` — HTTP controllers, guards, filters, and decorators

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

## Scripts

```bash
npm install
npm run build
npm run start:dev
npm run test
npm run test:e2e
npm run lint
```

## API Documentation

When the server is running, open `http://localhost:3000/api/docs` for Swagger UI.
