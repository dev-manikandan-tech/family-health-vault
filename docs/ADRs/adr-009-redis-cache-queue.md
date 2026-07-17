# ADR-009: Redis as Cache and Queue

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

The system needs caching (membership, rate limits, search results), an AI job queue, and real-time event distribution.

## Decision

Use **Cloud Memorystore Redis 7.x** in cluster mode. Use Redis Streams for the AI job queue, Redis hashes for rate limits, and Redis Pub/Sub for real-time notifications.

## Consequences

- Single managed service covers multiple use cases.
- Redis Streams supports consumer groups and retry semantics.

## Risks

- Redis is not a long-term persistence layer; job state is backed by PostgreSQL.
- A single Redis outage disables rate limiting and queues; use replication and failover.

## Alternatives

- Google Pub/Sub + Memorystore: rejected to reduce service count; Pub/Sub can be added later for cross-project events.
- RabbitMQ/Kafka: overkill for MVP scale.