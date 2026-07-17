# Folder Structure

```text
family-health-vault/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD pipelines
├── apps/
│   ├── mobile/              # React Native Expo app
│   │   ├── app/             # Expo Router screens
│   │   ├── components/      # Mobile UI components
│   │   ├── features/        # Domain-specific modules (auth, visits, docs)
│   │   ├── hooks/           # Shared React hooks
│   │   ├── lib/             # Utilities, API client, sync engine
│   │   ├── navigation/      # Navigation configuration
│   │   ├── store/           # Zustand/Redux stores
│   │   ├── services/        # Offline DB, background tasks
│   │   └── package.json
│   ├── web/                 # Next.js patient/family portal
│   │   ├── app/             # Next.js App Router
│   │   ├── components/
│   │   ├── lib/
│   │   ├── features/
│   │   └── package.json
│   └── admin/               # Next.js admin dashboard
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── package.json
├── services/
│   ├── api/                 # NestJS API gateway
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── families/
│   │   │   ├── persons/
│   │   │   ├── visits/
│   │   │   ├── documents/
│   │   │   ├── ai/
│   │   │   ├── search/
│   │   │   ├── sharing/
│   │   │   ├── audit/
│   │   │   ├── admin/
│   │   │   └── common/      # filters, guards, interceptors, pipes
│   │   ├── migrations/
│   │   ├── test/
│   │   └── package.json
│   └── ai/                  # Background AI worker
│       ├── src/
│       │   ├── providers/   # Google, OpenAI, Bedrock, self-hosted
│       │   ├── pipelines/   # OCR, classify, extract, summarize, embed
│       │   ├── prompts/
│       │   ├── processors/
│       │   └── main.ts
│       ├── test/
│       └── package.json
├── packages/
│   ├── types/               # Shared TypeScript types and Zod schemas
│   ├── ui/                  # Shared React UI components (web + mobile via RNP)
│   ├── config/              # Shared ESLint, Prettier, TS, Tailwind configs
│   └── ts-config/           # Shared tsconfig presets
├── infrastructure/
│   ├── terraform/           # GCP infrastructure as code
│   │   ├── modules/
│   │   └── environments/
│   ├── kubernetes/          # Kustomize / Helm manifests
│   │   ├── base/
│   │   └── overlays/
│   └── scripts/             # provisioning, backup, migration helpers
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ADRs.md
│   ├── ADRs/                # Individual ADR files
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── AI.md
│   ├── MOBILE.md
│   ├── INFRASTRUCTURE.md
│   ├── TRADEOFFS.md
│   ├── ROADMAP.md
│   └── FOLDER_STRUCTURE.md
├── README.md
├── LICENSE
└── .gitignore
```

## Conventions

- **Domain-first package naming**: `services/api/src/families/`, `apps/mobile/features/families/`.
- **Shared contracts**: all API request/response DTOs live in `packages/types` and are imported by both `services/api` and clients.
- **Database migrations**: live in `services/api/migrations` and are run as Kubernetes Jobs.
- **Secrets**: never committed; injected via Secret Manager + Kubernetes External Secrets Operator.