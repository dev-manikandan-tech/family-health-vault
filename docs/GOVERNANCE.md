# Architecture Governance

## Approval gates

1. **Architecture review** — This package must be reviewed and approved before any application code is written.
2. **Security review** — Threat model and RLS/encryption design must be signed off.
3. **Compliance review** — HIPAA-inspired and GDPR-inspired controls must be validated.
4. **Infrastructure review** — Terraform plans and CI/CD pipeline must be approved before deployment.

## Branching strategy

- `main` — approved architecture and release-ready code.
- `devin/architecture/*` — architecture proposals and ADRs.
- `devin/feature/*` — implementation branches created only after architecture approval.

## Definition of ready for implementation

- [ ] All ADRs approved.
- [ ] Database schema reviewed.
- [ ] API contracts reviewed.
- [ ] Security controls mapped to threats.
- [ ] GCP cost estimate produced.
- [ ] Runbook for incident response drafted.