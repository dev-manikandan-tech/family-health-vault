terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
  backend "gcs" {
    bucket = var.terraform_state_bucket
    prefix = "family-health-vault/terraform/state"
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

resource "google_compute_network" "vpc" {
  name                    = "${var.environment}-fhv-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${var.environment}-fhv-subnet"
  ip_cidr_range = "10.0.0.0/16"
  region        = var.gcp_region
  network       = google_compute_network.vpc.id
  private_ip_google_access = true
}

resource "google_container_cluster" "gke" {
  name     = "${var.environment}-fhv-cluster"
  location = var.gcp_region

  network    = google_compute_network.vpc.id
  subnetwork = google_compute_subnetwork.subnet.id

  remove_default_node_pool = true
  initial_node_count       = 1

  release_channel {
    channel = "REGULAR"
  }

  ip_allocation_policy {}

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = var.gke_enable_private_endpoint
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  dynamic "master_authorized_networks_config" {
    for_each = length(var.gke_master_authorized_cidrs) > 0 ? [1] : []
    content {
      dynamic "cidr_blocks" {
        for_each = var.gke_master_authorized_cidrs
        content {
          cidr_block   = cidr_blocks.value.cidr_block
          display_name = cidr_blocks.value.display_name
        }
      }
    }
  }
}

resource "google_container_node_pool" "primary" {
  name       = "${var.environment}-fhv-primary"
  location   = var.gcp_region
  cluster    = google_container_cluster.gke.id
  node_count = var.gke_node_count

  node_config {
    machine_type = var.gke_machine_type
    oauth_scopes = ["cloud-platform"]
  }
}

resource "google_sql_database_instance" "postgres" {
  name             = "${var.environment}-fhv-postgres"
  database_version = "POSTGRES_16"
  region           = var.gcp_region

  settings {
    tier              = var.cloud_sql_tier
    availability_type = "REGIONAL"
    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
    database_flags {
      name  = "cloudsql.enable_pgaudit"
      value = "on"
    }
  }
}

resource "google_redis_instance" "redis" {
  name           = "${var.environment}-fhv-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = var.redis_memory_gb
  region         = var.gcp_region
  authorized_network = google_compute_network.vpc.id
}

resource "google_storage_bucket" "documents" {
  name          = "${var.gcp_project}-${var.environment}-fhv-documents"
  location      = var.gcs_location
  force_destroy = false

  uniform_bucket_level_access = true

  encryption {
    default_kms_key_name = google_kms_crypto_key.documents.id
  }

  versioning {
    enabled = true
  }
}

resource "google_kms_key_ring" "main" {
  name     = "${var.environment}-fhv-keyring"
  location = var.gcp_region
}

resource "google_kms_crypto_key" "documents" {
  name     = "${var.environment}-fhv-documents-key"
  key_ring = google_kms_key_ring.main.id

  rotation_period = "7776000s"
}

resource "google_compute_managed_ssl_certificate" "main" {
  name = "${var.environment}-fhv-cert"

  managed {
    domains = [var.domain]
  }
}

resource "google_compute_security_policy" "waf" {
  name = "${var.environment}-fhv-waf"

  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Deny non-encrypted requests"
  }
}
