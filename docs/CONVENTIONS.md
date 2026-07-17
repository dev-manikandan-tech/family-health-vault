# MedVault Cross-Cutting Conventions

All phases must follow these conventions. Deviations require an ADR.

## Data Model

- Every table has:
  - `id` (`uuid` v7, primary key)
  - `created_at`
  - `updated_at`
  - `deleted_at` (soft delete)
- Every medical-data read or write emits an audit event: `(actor, action, resource, patient_profile_id, ip, timestamp)`.
- No PHI in logs. Structured logs use a redacting serializer; `console.log` of sensitive fields is prohibited.

## API

- All list endpoints use cursor pagination with a max page size of 50.
- All input validated with DTOs / Zod schemas shared from `packages/types`.
- Errors returned as RFC 7807 `problem+json`.
- Authentication: Supabase JWT verified via JWKS; the API never issues its own access tokens.
- Authorization: API guards enforce roles and consent grants; PostgreSQL RLS is defense-in-depth only.

## Files & Storage

- Originals are immutable and stored in private, SSE-KMS-encrypted buckets.
- Downloads only via short-lived signed URLs.
- Uploads are direct-to-storage via presigned PUT URLs; the API never proxies file bytes.

## AI / OCR

- No customer medical data used for model training.
- Extracted output validated against Zod schemas; missing fields are `null` with confidence `0`.
- No medical advice, diagnosis, or treatment recommendations generated.

## Code

- Clean Architecture: `domain/`, `application/`, `infrastructure/`, `interface/`.
- Conventional commits; feature branches; one PR per phase (or per aligned set of phases).
- All PRs pass lint, typecheck, unit tests, and integration tests.
