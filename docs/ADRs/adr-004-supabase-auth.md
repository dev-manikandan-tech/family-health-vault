# ADR-004: Supabase Auth

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

MVP requires email OTP, Google, and Apple login. Building a custom auth system is risky and time-consuming.

## Decision

Use **Supabase Auth** for identity in MVP. The API validates Supabase JWTs. User profiles and family membership are stored in our PostgreSQL database.

## Consequences

- Fastest path to MVP login flows.
- Portable JWT identities; migration path to other IdPs documented.
- Supabase Enterprise or a custom IdP will be needed for HIPAA BAA, SAML, and SCIM.

## Risks

- Vendor lock-in for auth unless abstraction layer is introduced early.
- HIPAA BAA requires Supabase Enterprise plan.

## Alternatives

- Auth0/Firebase Auth: rejected due to cost and tighter cloud coupling.
- Custom auth: rejected due to security risk and effort.