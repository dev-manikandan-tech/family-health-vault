# ADR-014: CMEK and KMS for Encryption

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

Medical data requires encryption at rest. Cloud-managed keys are easiest but may not satisfy enterprise or regulatory key-control requirements.

## Decision

Use **Cloud KMS Customer-Managed Encryption Keys (CMEK)** for Cloud SQL and Cloud Storage. Secrets and API keys live in **Secret Manager**. Implement key rotation and least-privilege IAM.

## Consequences

- Centralized key control and audit through Cloud KMS.
- Automatic key rotation for CMEK.
- Separation of duties between developers and key admins.

## Risks

- CMEK key loss means data loss; implement key backup and DR procedures.
- Slightly higher cost than Google-managed keys.

## Alternatives

- Google-managed encryption keys: acceptable for early MVP but not for formal HIPAA/SOC2.
- External key manager (HashiCorp Vault): operational overhead too high for MVP.