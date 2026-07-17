# MedVault — Improved Phase 1–3 Prompts

> These prompts supersede the original Phase 1–3 prompts in the working blueprint. They are tailored to the current repository state (NestJS + TypeORM already scaffolded, custom auth module in `services/api`) and to the requirements comparison in `docs/PHASE0_REVIEW.md`.

---

## Phase 1 — Foundation & Scaffolding

### Context

The monorepo skeleton exists with `services/api` as a NestJS + TypeORM project. The goal of this phase is to harden the foundation so every later phase is testable offline and follows a single set of conventions.

### Task

Bring `services/api` and the repo-wide developer experience up to the production baseline defined in `docs/CONVENTIONS.md`.

### Requirements

1. **Local development stack** (`docker-compose.yml` at repo root):
   - PostgreSQL 16 with `pgvector` and `pg_trgm` extensions
   - Redis 7
   - MinIO (S3-compatible, private buckets)
   - Mailpit (SMTP + web UI)
2. **Health endpoints** in `services/api`:
   - `GET /health/live` — always returns 200 (liveness)
   - `GET /health/ready` — checks DB and Redis connectivity, returns 503 if any dependency is down
3. **Logger**:
   - Replace default `console.log` with a PHI-redacting structured logger (`pino` + `nestjs-pino`)
   - Redact fields matching `*password*`, `*token*`, `*secret*`, `*otp*`, `*refresh*` before they reach stdout
4. **API errors**:
   - Global RFC 7807 `problem+json` exception filter
   - Standard response shape: `{ type, title, status, detail, instance }`
5. **Request context**:
   - Request-id middleware; include `x-request-id` in response headers
   - NestJS `ClsModule` or `AsyncLocalStorage` to carry actor/user id to audit/logger without passing it through every call stack
6. **Shared packages** (monorepo):
   - `packages/types` with Zod schemas for all API inputs (auth, family, profile, grant) and inferred TypeScript types
   - `packages/config` for shared ESLint/Prettier/TS config
7. **CI** (`.github/workflows/api.yml`):
   - Install, lint, typecheck, unit tests, e2e tests on every PR
   - Build Docker image for `services/api` and push to GHCR on merge to `main`
8. **Tooling**:
   - Shared ESLint + Prettier configs in `packages/config`; remove duplicated config in `services/api`
   - Husky + lint-staged pre-commit hook for `services/api`
9. **Documentation**:
   - `services/api/README.md` with `make dev` one-command setup
   - `docs/INFRASTRUCTURE.md` updated to use Docker + ECS/Railway/Fly instead of Kubernetes for MVP

### Edge Cases

- Health endpoint should not crash if Redis is optional (fallback to in-memory for local tests).
- Logger must not leak request bodies containing document text or medical keywords.
- `problem+json` filter must handle both NestJS `HttpException` and unexpected errors without exposing stack traces in production.

### Non-Goals

- No business logic beyond health/auth scaffolding.
- No migration to Prisma; continue using TypeORM. Document the decision in `docs/ADRs/typeorm-over-prisma.md` if asked.

### Definition of Done

- `make dev` boots all local services and the API.
- `GET /health/ready` returns 200 when Postgres and Redis are up.
- CI passes for lint/typecheck/test/build.
- One docs PR titled `phase-1: foundation`.

---

## Phase 2 — Authentication & Identity (Supabase Auth as IdP)

### Context

The current `services/api` has a custom JWT/auth module (signup, sign-in, refresh tokens, device sessions). This phase replaces the token-issuing responsibility with **Supabase Auth** while keeping the local `users` table as a read/audit cache. The API becomes a Supabase resource server: it verifies Supabase access tokens via JWKS, syncs the local `User` row, and manages its own session metadata.

### Task

Refactor `services/api` auth to use Supabase Auth as the IdP.

### Requirements

1. **JWT verification**:
   - Verify Supabase access tokens using JWKS from `https://<project-ref>.supabase.co/auth/v1/keys`
   - `JwtStrategy`/`SupabaseAuthGuard` extracts `sub` and `email` from the JWT
   - If the local `User` row does not exist, create it on first authenticated request
2. **Local `User` model** (simplified):
   - `id` = Supabase `sub`
   - `email`, `emailVerified`, `phone`, `phoneVerified`, `authProvider` (`google` | `apple` | `email` | `phone`)
   - `createdAt`, `updatedAt`, `deletedAt`
   - Remove `passwordHash` and `refreshTokens` tables (Supabase owns credentials)
3. **Phone OTP**:
   - `POST /auth/otp/phone/send` — send OTP via Supabase Auth to `+91...`
   - `POST /auth/otp/phone/verify` — verify phone with Supabase; on success ensure local `User` exists
   - Rate limits: 3 sends/hour per phone, 5 verify attempts per phone
4. **Device sessions**:
   - On every authenticated request, upsert a `DeviceSession` (`userId`, `deviceId`, `deviceName`, `ip`, `userAgent`, `lastActiveAt`)
   - `GET /auth/devices` list active devices for the user
   - `DELETE /auth/devices/:id` revoke a device session
5. **Account deletion** (DPDP right to erasure):
   - `POST /auth/account/delete` — soft-delete user, schedule a hard-delete job in 30 days
   - On soft delete: anonymize email, mark `deletedAt`, tombstone device sessions
   - `POST /auth/account/delete/cancel` — cancel pending hard-delete if user re-authenticates
6. **Audit events**:
   - Log `USER_CREATED`, `USER_UPDATED`, `DEVICE_REGISTERED`, `DEVICE_REVOKED`, `ACCOUNT_DELETION_REQUESTED`, `ACCOUNT_DELETION_CANCELED`, `ACCOUNT_HARD_DELETED`
   - Each event: `actorId`, `action`, `resourceType`, `resourceId`, `ip`, `userAgent`, `timestamp`
7. **Auth controller endpoints**:
   - `GET /auth/me` — current user profile
   - `GET /auth/devices` — list devices
   - `DELETE /auth/devices/:id` — revoke device
   - `POST /auth/account/delete` — request deletion
   - `POST /auth/account/delete/cancel` — cancel deletion
   - Remove signup/signin/social/refresh/password-reset endpoints (handled by Supabase client)
8. **Tests**:
   - `FakeSupabaseClient` with configurable JWKS + token generation for unit/integration tests
   - E2E tests for: first-request user creation, device listing/revocation, account deletion/cancel, audit log verification

### Edge Cases

- Token clock skew: allow 60-second leeway in test and 5-second in production.
- Same user logs in with Google then Apple (same email) — local `User` row is matched by `id` (Supabase `sub`), not email, so two distinct accounts unless Supabase links them.
- Deleted user tries to access API — return `401`/`ACCOUNT_DELETED`.
- Re-login within 30-day soft-delete window cancels deletion.

### Non-Goals

- No MFA/TOTP in this phase (Supabase handles it if enabled in dashboard).
- No admin roles or user impersonation.
- No enterprise SSO/SAML.

### Definition of Done

- All auth flows pass with `FakeSupabaseClient` in e2e tests.
- No password or refresh token material stored in the API database.
- Audit logs cover every auth mutation.
- `npm run test:e2e` passes.
- Open PR titled `phase-2: supabase-auth`.

---

## Phase 3 — Families, Profiles & Consent

### Context

The core data model is `User` (login identity) ↔ `PatientProfile` (medical subject) ↔ `Family` (group) ↔ `RecordAccessGrant` (consent). A `User` can have multiple `PatientProfile`s (themselves + dependents). A `Family` groups profiles. Grants govern who can see which profile's records.

### Task

Implement the family, profile, and consent modules in `services/api`.

### Requirements

1. **Entities**:
   - `PatientProfile`: `id`, `userId` (nullable), `familyId` (nullable), `name`, `dob`, `sex`, `bloodGroup`, `allergies[]`, `abhaId` (nullable), `managedByUserId`, `createdAt`, `updatedAt`, `deletedAt`
   - `Family`: `id`, `name`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt`
   - `FamilyMember`: `id`, `familyId`, `userId` (nullable), `email`, `name`, `role` (`owner` | `admin` | `member` | `dependent`), `joinedAt`, `createdAt`, `updatedAt`, `deletedAt`
   - `FamilyInvitation`: `id`, `familyId`, `email`, `role`, `token`, `invitedBy`, `status`, `expiresAt`, `acceptedAt`, `createdAt`, `updatedAt`, `deletedAt`
   - `RecordAccessGrant`: `id`, `patientProfileId`, `granteeUserId`, `scope` (`full` | `visits_only` | `emergency_card`), `grantedBy`, `expiresAt` (nullable), `createdAt`, `updatedAt`, `deletedAt`
2. **Family management**:
   - `POST /families` — create family; auto-create a self `PatientProfile` for the owner and an `owner` `FamilyMember`
   - `POST /families/:id/invite` — invite by email/phone with role; generate token; send via email/SMS
   - `POST /families/invitations/accept` — accept by token; create `FamilyMember` and optionally `PatientProfile` for dependents
   - `GET /families` — list my families (paginated, searchable by name)
   - `GET /families/:id` — get family + member count
   - `PATCH /families/:id` — rename (owner/admin)
   - `DELETE /families/:id` — soft delete (owner only)
   - `GET /families/:id/members` — list members (paginated, searchable by email/name)
   - `PATCH /families/:id/members/:memberId` — update role (owner/admin; cannot modify owner)
   - `DELETE /families/:id/members/:memberId` — remove member (owner/admin; cannot remove owner or self)
3. **Patient profiles**:
   - `POST /profiles` — create a dependent profile (requires managing user)
   - `GET /profiles` — list profiles I can access
   - `GET /profiles/:id` — get profile
   - `PATCH /profiles/:id` — update profile (manager or grant holder with `full` scope)
   - `DELETE /profiles/:id` — soft delete (manager only)
4. **Consent / record access grants**:
   - `POST /profiles/:id/grants` — create a grant (`scope`, `expiresAt` optional)
   - `GET /profiles/:id/grants` — list grants for a profile
   - `DELETE /grants/:id` — revoke a grant
   - Authorization helper `AuthorizationService.canAccessProfile(userId, profileId, requiredScope)` checks in order:
     1. User is the profile's `userId`
     2. User is the `managedByUserId`
     3. Active `RecordAccessGrant` exists with sufficient scope
     4. Otherwise deny
5. **Roles vs. grants**:
   - `owner`/`admin`/`member`/`dependent` govern **family administration** (invite, remove, rename)
   - `RecordAccessGrant` governs **medical data visibility**; being in a family grants no medical access by default
6. **Audit logging**:
   - Log `FAMILY_CREATED`, `FAMILY_UPDATED`, `FAMILY_DELETED`, `MEMBER_INVITED`, `INVITATION_ACCEPTED`, `MEMBER_ROLE_UPDATED`, `MEMBER_REMOVED`, `PROFILE_CREATED`, `PROFILE_UPDATED`, `PROFILE_DELETED`, `GRANT_CREATED`, `GRANT_REVOKED`
   - Every cross-profile read and grant mutation is audit-logged with `actorId`, `patientProfileId`, `action`, `ip`, `userAgent`, `timestamp`
7. **Soft delete**:
   - All family/profile/member/grant/invitation entities support soft delete
   - Cascade: soft-deleting a family soft-deletes its members, invitations, and profiles (but not audit logs)
8. **Pagination & search**:
   - Cursor pagination for all list endpoints; max page size 50
   - Search families by name; members by email/name; profiles by name
9. **Tests**:
   - Unit tests for `AuthorizationService` and grant logic
   - Integration tests for family CRUD, invite/accept flow, role updates, profile grants
   - **Authorization matrix tests** with explicit deny cases (member tries to see profile without grant, admin tries to delete owner, dependent tries to invite, etc.)

### Edge Cases

- A child profile has no `userId`; an adult `FamilyMember` with `dependent` role does have a `userId`.
- Dependent later creates an account: add a claim flow that transfers `userId` to the profile and revokes `managedByUserId` automatic access pending re-grant.
- Last owner cannot leave family without transferring ownership.
- Invite sent to existing user vs. new user; existing user can accept immediately.
- Duplicate pending invites to the same email should be rejected.
- `RecordAccessGrant` expiry should be checked on every read; expired grants do not grant access but remain in history.
- Soft-deleted profile cannot be read unless actor is owner/admin restoring it (future restore endpoint).

### Non-Goals

- No doctor-facing secure share links yet (post-MVP).
- No billing/subscription or family plan limits.
- No ABDM integration beyond the `abhaId` field.

### Definition of Done

- Authorization matrix test suite has explicit deny cases and passes.
- Audit logs are written for every family/profile/grant mutation and every cross-profile read.
- Swagger docs updated at `/api/docs`.
- `npm run test:e2e` passes.
- Open PR titled `phase-3: families-profiles-consent`.
