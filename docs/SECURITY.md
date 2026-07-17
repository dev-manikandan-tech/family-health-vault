# Security & Compliance Architecture

## 1. Threat model (STRIDE overview)

| Threat | Mitigation |
|---|---|
| **Spoofing / identity theft** | Supabase Auth JWT, MFA, secure session handling, refresh rotation. |
| **Tampering** | TLS 1.2/1.3, checksums on upload, RLS, audit logs, immutable buckets with object versioning. |
| **Repudiation** | Audit logs of every CRUD, share, export, and download. |
| **Information disclosure** | RLS, encryption at rest/transit, least-privilege IAM, no customer data in logs/AI prompts. |
| **Denial of service** | Rate limiting, Cloud Armor WAF, HPA, CDN, object lifecycle, request timeouts. |
| **Elevation of privilege** | RLS, role checks in app + DB, no service account sharing, secrets not in env. |

## 2. Encryption

### At rest
- **PostgreSQL**: Cloud SQL uses Google-managed encryption by default; for HIPAA readiness use **Customer-Managed Encryption Keys (CMEK)**.
- **Cloud Storage**: Google-managed or CMEK.
- **Redis**: In-transit TLS; optional at-rest encryption for Memorystore.
- **Backups**: Encrypted with same keys as source; stored in separate project/bucket.

### In transit
- TLS 1.2 minimum, TLS 1.3 preferred.
- mTLS between services in GKE (service mesh).
- Private Google Access to Cloud SQL, Redis, Storage.

### Application-level encryption (future)
- End-to-end encryption (E2EE) is not in MVP due to key recovery complexity.
- Document-level encryption with per-family keys can be added later using envelope encryption.

## 3. Key management

- **Cloud KMS** for application secrets, encryption keys, signing keys.
- **Secret Manager** for DB passwords, Supabase service role, API keys, Gemini credentials.
- Secrets injected at pod startup, never committed.
- Key rotation policy: automatic KMS rotation for CMEK; manual rotation for long-lived API keys every 90 days.

## 4. Authentication & authorization

- Supabase Auth issues short-lived JWTs (15 min) + refresh tokens.
- API validates JWT signature via JWKS.
- Family membership and role resolved on each request and cached in Redis.
- RLS policies enforce tenant isolation at the database.
- Application guards enforce business rules (e.g., only Family Owner can delete family).

## 5. Audit & logging

- Every CRUD operation, login, share, export, and download logged.
- `audit_logs` table with monthly partitions.
- High-volume logs sink to **BigQuery** for long-term retention and compliance queries.
- Cloud Logging captures infrastructure events.
- Log retention: 1 year operational, 7 years compliance (configurable by jurisdiction).
- PII redaction in logs (no document names, no search queries in plain text).

## 6. Data privacy (GDPR-inspired)

- **Consent records** for AI processing and data sharing.
- **Right to erasure**: account deletion initiates a 30-day grace period, then permanent purge of DB records and Cloud Storage objects.
- **Right to access**: one-click data export (ZIP + JSON/FHIR manifest).
- **Data minimization**: only collect necessary fields; AI does not retain inputs.
- **Privacy by default**: new features require privacy review.

## 7. Sharing & guest access

- Share links use unguessable UUID tokens.
- Shares have expiration and read-only permission.
- RLS `app.current_share_token` allows guests to access only specific resources.
- Access count and IP logged.
- Revocation removes the token and invalidates caches.

## 8. Infrastructure security

- **Cloud Armor**: WAF rules, IP allow/deny, rate-based rules, bot defense.
- **Private GKE cluster**: nodes have no public IPs; control plane accessible via authorized networks only.
- **VPC Service Controls**: protect Cloud SQL, Storage, KMS from exfiltration.
- **Workload Identity**: pods use Kubernetes service accounts mapped to GCP service accounts.
- **Container security**: non-root images, distroless where possible, vulnerability scanning in CI.
- **Network policies**: restrict pod-to-pod traffic.
- **Ingress**: HTTPS only, HSTS, secure cookies, CSP headers.

## 9. Compliance posture

### MVP
- HIPAA-inspired controls: encryption, access controls, audit, BAA with GCP (for Cloud SQL/Storage).
- GDPR-inspired controls: consent, export, erasure, data minimization, privacy policy.
- Data residency: India primary region.

### Roadmap
- HIPAA Business Associate Agreement with all subprocessors.
- SOC 2 Type II audit.
- ISO 27001.
- India DPDP compliance.
- ABDM integration with required security certifications.

## 10. Incident response

- Automated alerts for high error rates, brute-force login, unusual download volume.
- Runbook for data breach: lockdown, revoke tokens, rotate keys, notify DPO.
- Quarterly access reviews and penetration tests.