# MedVault Infrastructure

This directory contains Terraform and Kubernetes manifests for deploying the Family Health Vault API to Google Cloud Platform.

## Structure

- `terraform/` - GCP infrastructure as code (GKE, Cloud SQL, Redis, GCS, Cloud Armor, KMS).
- `kubernetes/` - K8s manifests for the API deployment, service, ingress, and namespace.

## Deployment

1. Configure variables in `terraform/terraform.tfvars`.
2. Initialize and apply Terraform:
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```
3. Build and push the API image:
   ```bash
   gcloud builds submit --config services/api/cloudbuild.yaml services/api
   ```
4. Apply Kubernetes manifests:
   ```bash
   kubectl apply -f infrastructure/kubernetes/namespace.yaml
   kubectl apply -f infrastructure/kubernetes/
   ```

## Security

- Private GKE nodes with authorized networks.
- Cloud SQL private IP and automated daily backups.
- GCS bucket with CMEK and object versioning.
- Cloud Armor WAF and managed SSL certificates.
- Secret management via Kubernetes Secrets and Google Secret Manager.
