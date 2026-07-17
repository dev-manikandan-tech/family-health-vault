# Delivery Roadmap (Aligned with Improved Blueprint)

> See `docs/PHASE0_REVIEW.md` for the previous-vs-current requirements comparison and `docs/PHASES_1_2_3_BLUEPRINT.md` for the ready-to-run Phase 1–3 prompts.

## Phase 0: Requirements & Architecture (weeks 1–2)

- Finalize PRD, SYSTEM_DESIGN, DATA_MODEL, SECURITY_MODEL, API_SPEC, CONVENTIONS.
- Decide modular monolith vs. microservices (decision: modular monolith).
- Choose DPDP Act 2023 as the primary compliance frame.
- Separate `User` (login) from `PatientProfile` (medical subject) in the data model.
- Define consent-based record access grants.

## Phase 1: Foundation & Scaffolding (weeks 3–4)

- `docker-compose` local stack: Postgres 16 + pgvector/pg_trgm, Redis 7, MinIO, Mailpit.
- Health endpoints, PHI-redacting logger, RFC 7807 error filter, request-id middleware.
- `packages/types` with Zod schemas, `packages/config` for shared tooling.
- GitHub Actions CI: lint, typecheck, test, build, Docker image on `main`.
- `services/api` README with `make dev` one-command setup.

## Phase 2: Authentication & Identity (weeks 5–7)

- Supabase Auth as IdP; verify JWT via JWKS.
- Local `User` row as sync/audit cache; no API-side passwords or refresh tokens.
- Phone OTP via Supabase.
- Device session tracking and revocation.
- Account deletion with 30-day soft-delete window and cancel flow.
- Audit events for all auth mutations.

## Phase 3: Families, Profiles & Consent (weeks 8–11)

- `Family`, `FamilyMember`, `FamilyInvitation`, `PatientProfile`, `RecordAccessGrant`.
- Family CRUD, invite/accept, role management, soft delete.
- Patient profile CRUD with ABDM-ready `abha_id`.
- Consent-based grants: `full`, `visits_only`, `emergency_card`.
- Authorization matrix with explicit deny cases.
- Pagination, search, audit logging for all mutations and cross-profile reads.

## Phase 4: Medical Visits (weeks 12–14)

- Visit CRUD with date, doctor, hospital, diagnosis, notes.
- Soft delete + restore within 14 days.
- Visit-level authorization via grants.
- Timezone handling (`Asia/Kolkata` display, `timestamptz` storage).

## Phase 5: Document Upload & Processing (weeks 15–18)

- Presigned direct upload flow.
- Virus scan, HEIC→JPEG, thumbnail, metadata extraction pipeline (BullMQ).
- Private S3-compatible storage, SSE-KMS, signed download URLs.
- Status machine and DLQ.

## Phase 6: OCR & Extraction (weeks 19–22)

- Gemini 1.5 Flash vision behind an `ExtractorProvider` interface.
- Zod-schema-validated structured output per document type.
- Confidence gating and human-in-the-loop corrections.
- Cost circuit breaker and no-PHI logging.

## Phase 7: Timeline (weeks 23–25)

- Materialized `timeline_events` table.
- `GET /profiles/:id/timeline` with cursor pagination and filters.
- PDF export for data portability.

## Phase 8: Search (weeks 26–28)

- Postgres FTS (`tsvector` + GIN), `pg_trgm` autocomplete, `pgvector` embeddings.
- Consent-safe pre-filtering by grants.
- Query understanding for Indian context ("amma", "HbA1c", "Apollo", Hinglish).

## Phase 9: Notifications (weeks 29–31)

- Transactional outbox pattern.
- BullMQ workers for push (Expo), email, in-app.
- Quiet hours, idempotency, security-alert overrides.
- No medical details in notification payloads.

## Phase 10: Production Hardening & Launch (weeks 32–34)

- OWASP ASVS L2 self-assessment.
- IDOR sweep, dependency audit, secret scan.
- Terraform for ECS/Railway/GKE-ready Docker, RDS Postgres, ElastiCache, S3, CloudFront/WAF.
- k6 load tests, backup restore drill, runbooks.
- DPDP erasure verification and go/no-go launch checklist.

## Post-MVP

- FHIR R4 import/export.
- DICOM viewer and storage.
- ABDM integration.
- Google Health Connect / Apple HealthKit.
- Lab/insurance/hospital APIs.
- HIPAA/SOC2/ISO audits.
