# ADR-002: NestJS for API Services

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

The backend needs a strongly typed, modular API with authentication, authorization, audit logging, and pluggable AI providers. A lightweight framework could be faster to start but harder to scale with compliance requirements.

## Decision

Use **NestJS** for the `services/api` gateway and `services/ai` worker. Use TypeScript end-to-end. Use guards, interceptors, and pipes to enforce cross-cutting concerns (auth, RLS context, audit, validation).

## Consequences

- Consistent module structure across services.
- Swagger/OpenAPI generation from decorators.
- DI enables testing and swapping providers (e.g. AI providers).

## Risks

- Heavier than Fastify/Express; team must learn decorators and lifecycle hooks.

## Alternatives

- Fastify: rejected because RLS/audit integration would require custom middleware boilerplate.
- Python (Django/FastAPI): rejected to keep a single language stack and leverage shared `packages/types`.