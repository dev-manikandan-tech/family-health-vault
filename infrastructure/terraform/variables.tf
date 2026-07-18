variable "gcp_project" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "Primary GCP region"
  type        = string
  default     = "asia-south1"
}

variable "gcs_location" {
  description = "GCS bucket location"
  type        = string
  default     = "ASIA-SOUTH1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "domain" {
  description = "API domain"
  type        = string
}

variable "terraform_state_bucket" {
  description = "GCS bucket for Terraform state"
  type        = string
}

variable "gke_node_count" {
  description = "Number of GKE nodes"
  type        = number
  default     = 3
}

variable "gke_machine_type" {
  description = "GKE node machine type"
  type        = string
  default     = "e2-medium"
}

variable "gke_enable_private_endpoint" {
  description = "Disable public Kubernetes API endpoint"
  type        = bool
  default     = true
}

variable "gke_master_authorized_cidrs" {
  description = "CIDR blocks allowed to access the GKE control plane"
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  default = []
}

variable "cloud_sql_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-g1-small"
}

variable "redis_memory_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 5
}
