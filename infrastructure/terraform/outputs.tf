output "gke_cluster_name" {
  value = google_container_cluster.gke.name
}

output "gke_endpoint" {
  value = google_container_cluster.gke.endpoint
}

output "cloud_sql_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "redis_host" {
  value = google_redis_instance.redis.host
}

output "documents_bucket" {
  value = google_storage_bucket.documents.name
}

output "kms_key_name" {
  value = google_kms_crypto_key.documents.id
}
