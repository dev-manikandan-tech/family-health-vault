# Phase 0 Review — Previous vs. Improved Requirements

## Summary

The improved blueprint tightens the architecture for an India-first, DPDP-compliant family PHR. It keeps the core product vision but replaces the day-one microservices / Kubernetes plan with a right-sized NestJS modular monolith, makes PostgreSQL the single datastore, and separates login identity from medical subject identity before data is written.

## Comparison Matrix

| Area | Previous Requirements | Improved Blueprint Requirements | Impact |
|---|---|---|---|
| **Architecture** | 4 microservices (`api`, `ai-service`, `search-service`, `notification`) from day one | NestJS modular monolith; extract services only when a module needs independent scale | Simpler deployment, fewer network failure modes at 10k users |
| **Orchestration** | Kubernetes-ready / GKE from MVP | Docker + managed platform (ECS/Railway/Fly); K8s-ready Dockerfiles for later | Faster launch, less operational overhead |
| **Search** | Separate search service, Elasticsearch/Pinecone implied | PostgreSQL FTS (`tsvector`, `pg_trgm`) + `pgvector` for semantic search | One datastore, one backup/RLS boundary, <200ms at this scale |
| **Compliance primary frame** | HIPAA-inspired, GDPR-inspired | India's DPDP Act 2023 first; HIPAA-style technical controls as engineering bar | Legally correct for India-first launch |
| **Patient identity** | User and patient conflated | `User` = login identity; `PatientProfile` = medical subject; nullable `abha_id` for ABDM | Supports dependents, caregivers, future ABDM linkage |
| **Family access control** | Role-only (Owner/Admin/Member/Dependent/Guest) | Roles manage family admin; `RecordAccessGrant` governs medical visibility with scope + expiry + audit | Fine-grained, consent-based sharing required by DPDP |
| **Auth** | Google, Apple, email OTP (custom JWT in current code) | Supabase Auth as IdP; JWKS verification; phone OTP; session model; account deletion | Offload identity/security to IdP; add erasure flow |
| **Data model** | Family → Person → Visit → Documents | Same core, but `Person` becomes `PatientProfile` with `managed_by_user_id`, `abha_id`, `blood_group`, `allergies` | Cleaner separation for consent and ABDM |
| **Document upload** | API-proxied upload (implied) | Direct-to-storage presigned PUT; virus scan, HEIC→JPEG, EXIF strip, thumbnail, OCR pipeline | Scales on mobile networks; immutable originals |
| **AI / OCR** | Google Gemini Pro, unspecified output | Gemini 1.5 Flash vision; structured JSON via Zod schema; confidence gating; human review | Schema-validated, eval-ready, no invented values |
| **Queue** | Redis mentioned | Redis + BullMQ for OCR, notifications, retries | Explicit, retryable pipeline |
| **Storage** | Cloud Storage | S3-compatible, SSE-KMS, private buckets, signed URLs | Explicit encryption and access story |
| **Types** | Manual TS types | Zod schemas in `packages/types` shared by FE/BE | Single source of truth for validation |
| **Pagination** | Not explicitly specified | Cursor pagination for lists, max page size 50 | Consistent API contract |
| **Errors** | Not specified | RFC 7807 `problem+json` | Standard client error handling |
| **Logging** | Audit logging mentioned | `pino` with PHI-redacting serializer; **no PHI in logs ever** | Compliance and security requirement |
| **Tests** | Unit + integration tests | Testcontainers integration tests, deny-matrix auth tests, perf tests as merge gates | Higher assurance on medical data access |
| **Local dev** | Not specified | `docker-compose`: Postgres 16 + pgvector/pg_trgm, Redis 7, MinIO, Mailpit | One-command offline dev |
| **CI/CD** | GitHub Actions | Lint, typecheck, test, build on PR; Docker image build on `main` | Repeatable gates |

## Decisions for This PR (Phases 1–3)

1. Keep `services/api` as the NestJS modular monolith; add `modules/family` and `modules/profile` inside it.
2. Continue using TypeORM (already in place) rather than switching to Prisma mid-flight; a future ADR can revisit.
3. Refactor auth to verify Supabase JWT via JWKS; keep a `FakeSupabaseClient` for integration tests.
4. Add `PatientProfile` separate from `User`; every family owner gets a self profile on family creation.
5. Implement family management plus `RecordAccessGrant` with explicit deny-matrix tests.
6. Add audit logging for auth and family actions, and an account-deletion endpoint (soft-delete + 30-day hard-delete queue stub).
7. Add `/health/live` and `/health/ready` endpoints and a `docker-compose.yml` for local services.
8. Introduce `docs/CONVENTIONS.md` as the cross-cutting contract for later phases.
