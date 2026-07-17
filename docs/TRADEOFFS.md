# Architecture Tradeoffs

## 1. Monorepo vs. polyrepo

**Decision**: Monorepo (`family-health-vault`).

| Pros | Cons |
|---|---|
| Atomic changes across API, web, mobile, and infra | Larger repository, longer CI |
| Shared types, UI, and config packages | Tooling complexity (Turborepo/Nx) |
| Single version history and release train | Requires strict code ownership |
| Easier cross-service refactoring | Larger clone size with binaries |

**Rationale**: At 10k–1M users, the team size and cross-cutting changes favor a monorepo. Use Turborepo or Nx to mitigate CI size.

## 2. NestJS vs. Express/Fastify

**Decision**: NestJS for API and AI services.

| Pros | Cons |
|---|---|
| Opinionated structure, DI, modules | Heavier than Fastify/Express |
| Excellent TypeScript support | Learning curve for new team members |
| Built-in guards, interceptors, swagger | Slightly more boilerplate |

**Rationale**: Predictable architecture and strong enterprise patterns scale well with compliance features (guards, interceptors for audit/RLS).

## 3. PostgreSQL RLS vs. application-level access control

**Decision**: Both. RLS at the database + explicit guards in NestJS.

| RLS pros | RLS cons |
|---|---|
| Defense in depth; hard to bypass | Adds per-request session setup overhead |
| Centralized access rules | Prisma/TypeORM need custom query wrappers |
| Strong compliance story | Must be carefully tested |

**Rationale**: Defense in depth is worth the overhead for a health platform. RLS policies are the final backstop; application guards enforce business intent.

## 4. Supabase Auth vs. custom/Auth0

**Decision**: Supabase Auth for MVP.

| Pros | Cons |
|---|---|
| Built-in OTP, social login, passwordless | Tied to Supabase ecosystem |
| Free tier and easy setup | Enterprise SSO/SAML not in free tier |
| JWT-based, portable identities | BAA for HIPAA requires Enterprise plan |

**Rationale**: Fastest path to MVP. Plan migration to SAML/Enterprise SSO when selling to clinics/hospitals.

## 5. Cloud SQL vs. Supabase hosted Postgres

**Decision**: Cloud SQL for production; Supabase acceptable for early MVP/prototyping.

| Cloud SQL pros | Cloud SQL cons |
|---|---|
| Full GCP IAM, VPC, KMS, BAA | Higher operational burden |
| Easier HIPAA/SOC2 documentation | Need to manage backups/replicas |
| Better read-replica scaling | Slightly more setup |

**Rationale**: For India data residency and enterprise compliance, Cloud SQL is the long-term target. Supabase can accelerate the first 1,000 users.

## 6. Direct-to-Storage upload vs. proxy upload

**Decision**: Signed URL direct upload to Cloud Storage.

| Pros | Cons |
|---|---|
| API pods not bottlenecked by large files | Harder to validate before upload |
| Better upload performance | Need to verify object after upload |
| CDN-friendly downloads | More complex flow |

**Rationale**: Supports 100 MB files without eating API bandwidth.

## 7. Google Gemini vs. other AI providers

**Decision**: Google Gemini Pro via Vertex AI as default; pluggable provider interface.

| Pros | Cons |
|---|---|
| Strong multimodal OCR/vision | No customer training guarantee unless enterprise DPA |
| Vertex AI offers VPC/contractual controls | Provider lock-in if not abstracted |

**Rationale**: Gemini's multimodal capabilities match document OCR/extraction needs. The `AIProvider` interface future-proofs against lock-in.

## 8. React Native Expo vs. native iOS/Android

**Decision**: Expo for cross-platform mobile.

| Pros | Cons |
|---|---|
| One codebase for iOS/Android | Larger binary, less native control |
| Easier offline/SQLite plugins | Native module complexity for advanced features |

**Rationale**: Speed to market and team efficiency. Re-evaluate if DICOM viewing requires native performance.

## 9. Full-text search in PostgreSQL vs. Elasticsearch/OpenSearch

**Decision**: PostgreSQL `tsvector` + `pgvector` for MVP; Elasticsearch/OpenSearch as future option.

| Postgres pros | Postgres cons |
|---|---|
| Single database, no extra service | Refresh overhead for materialized views |
| Good enough for 2M docs | Complex ranking at scale |

**Rationale**: Eliminates operational overhead and cost at MVP scale. Re-evaluate at 10M+ documents.

## 10. Stateful vs. stateless AI workers

**Decision**: Stateless AI workers consuming Redis Streams.

| Pros | Cons |
|---|---|
| Horizontal scaling by queue depth | Job state in DB/Redis, not worker memory |
| Easy retry and dead-letter handling | Need idempotent workers |

**Rationale**: Stateless design is essential for scaling AI processing with variable load.

## 11. End-to-end encryption (E2EE)

**Decision**: Not in MVP.

| Pros of E2EE | Cons of E2EE |
|---|---|
| Strongest privacy | Key recovery is hard for families |
| Reduces provider liability | Breaks AI processing unless client-side |

**Rationale**: E2EE would prevent server-side AI and sharing. Defer until legal/regulatory demand or premium tier requires it; document as future ADR.