# ADR-003: PostgreSQL with Row Level Security

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

Each family is a tenant. Tenant isolation must be enforced at the database layer to satisfy the security and compliance posture.

## Decision

Use **PostgreSQL 15+** with **Row Level Security (RLS)**. Every tenant-scoped table includes `family_id`. The API sets `app.current_user_id` and `app.current_family_ids` via `SET LOCAL` at transaction start. RLS policies check these variables.

## Consequences

- Even if application code misses a filter, the database rejects cross-tenant access.
- Requires custom query wrappers or connection management in TypeORM/Prisma.
- Each request is wrapped in a transaction to set session variables.

## Risks

- RLS can degrade performance if policies are not indexed.
- Connection poolers (PgBouncer) in transaction mode work with `SET LOCAL` but require careful testing.
- Bypass RLS only through dedicated admin roles.

## Alternatives

- Application-level filtering only: rejected because it is bypassable.
- Separate schema per family: rejected due to migration and connection overhead at scale.
- Separate database per family: rejected due to cost and operational complexity.