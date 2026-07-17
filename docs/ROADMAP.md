# Delivery Roadmap

## Phase 0: Foundation (weeks 1–2)

- Finalize architecture and ADRs.
- Set up GCP project, GKE, Cloud SQL, Redis, Storage.
- Set up GitHub repo, CI/CD, Terraform baseline.
- Bootstrap monorepo (Turborepo/Nx).
- Implement Supabase Auth login (web + mobile).

## Phase 1: Family & Person Core (weeks 3–5)

- Family CRUD, invitations, roles.
- Person CRUD.
- Medical visit CRUD.
- Database schema + RLS policies.
- Audit logging.

## Phase 2: Document Management (weeks 6–9)

- Signed upload URL flow.
- Document metadata, categories, soft delete, restore.
- Download with signed URLs.
- Thumbnails for images.
- Basic search by filename + visit data.

## Phase 3: AI Pipeline (weeks 10–13)

- AI worker scaffolding.
- OCR, classification, entity extraction.
- AI summaries and timeline generation.
- Smart tagging.
- Duplicate detection.
- Natural language search.

## Phase 4: Mobile Offline & Sharing (weeks 14–17)

- WatermelonDB integration.
- Background sync.
- Offline upload queue.
- Share links and guest access.
- Tablet and accessibility polish.

## Phase 5: Web Admin & Compliance (weeks 18–20)

- Admin dashboard.
- Data export.
- Account deletion / erasure.
- Consent management.
- Security review and penetration test.

## Phase 6: Scale & Harden (weeks 21–24)

- Load testing to 10k users.
- Read replicas, CDN tuning.
- CI/CD hardening.
- Monitoring and runbooks.
- Beta launch.

## Phase 7: Post-MVP

- FHIR import/export.
- DICOM support.
- ABDM integration.
- Health Connect / HealthKit.
- HIPAA/SOC2/ISO audits.