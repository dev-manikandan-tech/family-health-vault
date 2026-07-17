# ADR-013: Modular Monolith over Microservices

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

The backend must start simple but scale. Microservices add network, deployment, and observability overhead that is unnecessary at MVP scale.

## Decision

Build a **modular monolith**: a single `services/api` NestJS application with clear modules (families, persons, visits, documents, AI, search, sharing, audit). Extract `services/ai` only because AI processing is CPU/GPU intensive and scales independently.

## Consequences

- Simpler deployment and transaction boundaries.
- Later extraction of services (e.g. sharing, search) is straightforward due to module boundaries.

## Risks

- Monolith can become unwieldy without discipline; enforce module boundaries.
- CPU-heavy AI work must not starve API pods; `services/ai` is separate.

## Alternatives

- Full microservices from day one: rejected due to ops cost and unknown boundaries.
- Serverless functions (Cloud Run): considered for AI but stateful background workers prefer Kubernetes Jobs.