# ADR-001: Monorepo and Repository Structure

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

Family Health Vault has multiple clients (mobile, web, admin), backend services (API, AI), shared types, and infrastructure code. Coordination across independent repositories can slow delivery and fragment versioning.

## Decision

Adopt a single monorepo with the structure documented in `docs/FOLDER_STRUCTURE.md`:
- `apps/` for user-facing applications.
- `services/` for backend workers.
- `packages/` for shared code.
- `infrastructure/` for Terraform and Kubernetes.
- `docs/` for architecture and ADRs.

## Consequences

- Shared packages (`types`, `ui`, `config`) reduce duplication.
- A single CI pipeline can validate cross-cutting changes.
- Repository clone size and build times may grow; mitigated by Turborepo/Nx remote caching.

## Risks

- Poorly scoped shared packages create tight coupling.
- Build failures in one app block unrelated deployments if CI is not granular.

## Alternatives

- Polyrepo: each service in its own repo. Rejected because cross-service changes (e.g. adding a new field to an API and mobile UI) require multiple PRs and version synchronization.