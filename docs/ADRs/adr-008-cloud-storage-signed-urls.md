# ADR-008: Cloud Storage with Signed URLs

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

Users upload files up to 100 MB. Proxying every upload through API pods would consume bandwidth and CPU, increasing cost and latency.

## Decision

Use **Google Cloud Storage** with **signed URLs**. The API validates permissions, creates a metadata record, and returns a time-limited signed URL. The client uploads directly to Cloud Storage. Downloads also use short-lived signed URLs served through Cloud CDN.

## Consequences

- API pods handle only metadata, not binary data.
- Cloud CDN accelerates downloads globally.
- Requires post-upload verification (HEAD object) to ensure integrity.

## Risks

- Signed URL leaks could allow unauthorized access until expiration.
- Client must retry failures; upload state must be tracked.

## Alternatives

- Tus/resumable uploads: supported by GCS but adds client complexity; implement if mobile networks prove unreliable.
- Proxy through API: rejected for performance reasons.