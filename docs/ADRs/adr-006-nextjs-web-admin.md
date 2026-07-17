# ADR-006: Next.js for Web and Admin

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

The patient/family portal and the platform admin dashboard are web applications. They need SEO, server-side rendering, and API integration.

## Decision

Use **Next.js App Router** for both `apps/web` and `apps/admin`. Server components fetch protected data; client components handle interactivity. Shared UI lives in `packages/ui`.

## Consequences

- Unified React/TypeScript stack with mobile and backend.
- App Router enables server-side data fetching and parallel routes.
- Both apps can be deployed to GKE (custom server) or exported statically behind the API.

## Risks

- Admin portal must be network-restricted (Cloud IAP / VPN) to prevent public exposure.

## Alternatives

- Vite SPA: rejected because SSR and API routes simplify auth and SEO.
- Remix: viable alternative; Next.js chosen for broader ecosystem and team familiarity.