# Product Requirements Document (PRD)

> This PRD is the consumer-facing baseline. The technical architecture, phase prompts, and previous-vs-current requirements comparison are in `docs/CONVENTIONS.md`, `docs/PHASE0_REVIEW.md`, and `docs/PHASES_1_2_3_BLUEPRINT.md`.

## 1. Vision

A secure, consumer-first Personal Health Record that lets individuals and families store, organize, search, and share every medical document as a single, coherent health timeline.

## 2. Personas

| Persona | Description | Primary goals |
|---|---|---|
| Individual | Manages their own health records | Upload, search, timeline, export |
| Family Owner | Creates a family vault and invites members | Manage members, permissions, billing |
| Family Admin | Manages records for the family | Add visits/documents, manage tags, share |
| Family Member | Owns or contributes to their own records | Upload documents, view timeline |
| Dependent | Child or elderly parent whose records are managed by others | Records added by owner/admin |
| Read-only Guest | Temporary viewer of specific records | Access shared link without account |
| Platform Admin | Internal support / compliance team | Audit, support, abuse handling |

## 3. Core MVP features

### Authentication & identity
- Sign-up / sign-in via **Google**, **Apple**, and **Email OTP**.
- Profile management (name, phone, avatar).
- Multi-factor authentication (MVP: TOTP; roadmap: hardware keys).

### Family management
- Create a family vault.
- Invite members by email or phone.
- Assign roles: Owner, Admin, Member, Dependent, Guest.
- A single user can belong to multiple families (e.g. caregiver for aging parent).
- Family roles govern **membership administration**; medical record access requires an explicit consent-based `RecordAccessGrant`.

### Patient profile management
- A `PatientProfile` is the medical subject and is separate from the login `User`.
- Add profiles within a family (self or dependents).
- Capture name, date of birth, sex, blood group, allergies, ABHA ID, relationship, notes.
- Link a `User` account to one or more profiles; a dependent profile may have no `User` (managed by a caregiver).
- Each medical record (visit, document, lab result) belongs to a `PatientProfile`.

### Medical visits
- Create a visit: title, date, doctor, hospital/department, diagnosis, notes.
- Visit is the primary organizing unit for documents.
- Timeline view groups visits chronologically.

### Documents
- Upload PDF, JPEG, PNG, HEIC.
- Max file size: **100 MB**.
- Multiple documents per visit.
- Document categories: prescription, lab report, scan report, medical bill, discharge summary, vaccination record, insurance document, referral letter, other.
- Original file name, size, MIME type, checksum stored.
- View, download, replace, soft-delete, restore.
- Thumbnail generation for images.

### AI features (MVP)
- OCR for printed and (best-effort) handwritten text.
- Document classification into categories.
- Extraction of:
  - Doctor / hospital / visit date
  - Diagnosis / symptoms
  - Medications
  - Lab tests and results
  - Billing information
- Timeline generation from visits and extractions.
- AI-generated summaries per visit and per person.
- Natural language search and semantic search.
- Smart tagging.
- Duplicate detection (exact and near-duplicate).

### Sharing & access control
- Family membership roles manage administration (invite, rename, remove).
- Medical record access is governed by explicit, revocable `RecordAccessGrant` consent with scope (`full`, `visits_only`, `emergency_card`) and optional expiry.
- Time-limited, read-only share links for documents or visits.
- Revoke shares and grants.
- Audit log of every grant creation, revocation, and access.

### Data control
- Soft delete with 30-day recovery window.
- Permanent account deletion (GDPR-inspired right to erasure).
- Data export: ZIP of original documents + JSON manifest + FHIR-like summary.
- Consent records for AI processing and data sharing.

### Mobile
- Single Expo app.
- Offline access to previously synced documents and metadata.
- Offline upload queue with background sync.
- Offline search over cached metadata.
- Tablet layout support.
- Accessibility AA (screen reader, font scaling, color contrast).

### Web
- Next.js patient/family portal.
- Responsive layout.
- Accessibility AA.

## 4. Future roadmap

- DICOM viewer and storage.
- FHIR R4 import/export.
- HL7 message ingestion.
- ABDM (India) integration.
- Google Health Connect / Apple HealthKit import.
- Insurance API integrations.
- Laboratory API integrations.
- Hospital API integrations.
- Doctor / clinic / hospital / insurance company portals.
- SAML / SCIM / Enterprise SSO.
- Advanced analytics and health trends.
- Clinical decision support (after regulatory clarity; not in MVP).

## 5. Non-functional requirements

| Requirement | Target |
|---|---|
| Active users (MVP) | 10,000 registered |
| API p95 read latency | < 500 ms |
| API p95 write latency | < 1,000 ms |
| Document upload start | < 5 seconds (signed URL generation) |
| AI processing time | < 60 seconds per document (background) |
| Uptime | 99.9% |
| RTO | 4 hours |
| RPO | 24 hours (daily backups) |
| Data residency | India (primary); architecture supports multi-region |
| Security / compliance | DPDP Act 2023 first; HIPAA-inspired + GDPR-inspired technical controls |
| AI data privacy | No training on customer data |
| Accessibility | WCAG 2.1 AA |
| Scale ceiling | 1,000,000 users without redesign |

## 6. Assumptions & constraints

- MVP uses a NestJS modular monolith (`services/api`) with PostgreSQL; services are extracted only when a module needs independent scale.
- Supabase Auth will be used for identity in MVP; the API verifies Supabase JWTs and does not issue its own access tokens.
- `User` (login identity) is separate from `PatientProfile` (medical subject); consent-based `RecordAccessGrant` controls record visibility.
- AI processing is asynchronous and best-effort for MVP.
- Handwritten text OCR accuracy is not guaranteed.
- DICOM/FHIR are future; MVP documents are static files.
- No clinical decision support or diagnosis in MVP.
- Users are responsible for the accuracy of manually entered visit data.