# Family Health Vault

> Working name: **Family Health Vault**  
> Alternatives: MedTimeline, HealthVault, MyHealthStory, CareVault, MedArchive

A consumer-first **Personal Health Record (PHR)** platform for individuals and families. The product is built around the idea of a **personal health timeline**:

```text
Family → Person → Medical Visit → Documents → AI Summary → Timeline
```

## Current status

This repository contains the **architecture package only**. All implementation work is gated behind your approval of the design.

## Target scale

| Metric | MVP | Future |
|---|---|---|
| Registered users | 10,000 | 1,000,000 |
| Family members | 50,000 | 5,000,000 |
| Medical visits | 500,000 | 50,000,000 |
| Uploaded documents | 2,000,000 | 200,000,000 |
| Uptime target | 99.9% | 99.95% |

## Core concept

A **Medical Visit** is the central domain entity. Documents, prescriptions, lab reports, bills, scans, and discharge summaries are all attached to a visit whenever possible. AI extracts structured data from documents and generates a searchable timeline for every person in a family.

## Tech stack

- **Mobile**: React Native Expo (single app for patients, family members, caregivers)
- **Web**: Next.js (patient/family portal + admin dashboard)
- **API**: NestJS
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Auth**: Supabase Auth (Google, Apple, Email OTP)
- **Cache / Queue**: Redis
- **AI**: Google Gemini Pro via a pluggable provider interface
- **Object storage**: Google Cloud Storage
- **Infra**: GCP, GKE, Cloud SQL, Cloud Memorystore, Cloud Armor, Cloud CDN, Terraform
- **CI/CD**: GitHub Actions

## Documentation index

- [docs/PRD.md](docs/PRD.md) — Product requirements
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture (C4)
- [docs/ADRs.md](docs/ADRs.md) — Architecture Decision Records
- [docs/API.md](docs/API.md) — API design
- [docs/DATABASE.md](docs/DATABASE.md) — Database schema & RLS
- [docs/SECURITY.md](docs/SECURITY.md) — Security & compliance
- [docs/AI.md](docs/AI.md) — AI pipeline & privacy
- [docs/MOBILE.md](docs/MOBILE.md) — Mobile/offline architecture
- [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) — GCP deployment & Kubernetes
- [docs/TRADEOFFS.md](docs/TRADEOFFS.md) — Key tradeoffs
- [docs/ROADMAP.md](docs/ROADMAP.md) — Delivery phases
- [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) — Monorepo layout
- [docs/GOVERNANCE.md](docs/GOVERNANCE.md) — Review gates & approval process