# ADR-007: Google Cloud Platform and GKE

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

India data residency, HIPAA-inspired controls, and future ABDM integration point to a cloud provider with strong Indian presence and healthcare compliance tooling.

## Decision

Use **Google Cloud Platform** with **GKE**, **Cloud SQL**, **Cloud Storage**, **Cloud Memorystore**, **Cloud Armor**, and **Cloud CDN**.

## Consequences

- Native support for Kubernetes, managed Postgres, Redis, object storage, and CDN.
- Cloud IAM, VPC Service Controls, and Cloud KMS map well to security requirements.
- India regions (`asia-south1`, `asia-south2`) support data residency.

## Risks

- GCP cost can exceed smaller providers; cost monitoring required.
- Multi-cloud portability is reduced; abstraction layers (Terraform modules, Kubernetes manifests) mitigate.

## Alternatives

- AWS EKS: strong but chosen GCP for India data-center presence and tighter integration with Gemini/Vertex AI.
- Azure AKS: viable but less mature in India and for Vertex AI.