# services/api

NestJS API gateway. Validates Supabase JWT, enforces tenant isolation, and orchestrates data and AI processing.

## Responsibilities

- REST API for families, persons, visits, documents, search, sharing
- RLS session variable management
- Audit logging
- Signed URL generation for Cloud Storage
- AI job event publishing
- Rate limiting and input validation

## Tech

- NestJS
- TypeORM / Prisma (TBD)
- Zod for validation
- Passport/JWT for auth
- OpenAPI/Swagger