# .github/workflows

GitHub Actions workflows.

## Workflows (planned)

- `ci.yml` — lint, typecheck, unit tests on PRs
- `security.yml` — SAST, dependency, secret scanning
- `build-and-push.yml` — build container images and push to Artifact Registry
- `deploy-staging.yml` — deploy to GKE staging
- `deploy-prod.yml` — production deployment gate
- `terraform-plan.yml` — Terraform plan on infra changes