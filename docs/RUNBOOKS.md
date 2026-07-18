# MedVault Production Runbooks

## Incident Response

1. Confirm the incident via logs (Cloud Logging) and alerts (Cloud Monitoring/PagerDuty).
2. Identify scope: auth, database, storage, AI provider, or upstream dependency.
3. For security incidents, rotate secrets immediately and revoke active device sessions.
4. Use `kubectl rollout restart deployment/fhv-api -n fhv` to restart pods after a fix.
5. Communicate status via the `#incidents` channel; postmortem within 24 hours.

## Backup and Restore

- Cloud SQL automated backups run daily at 03:00 Asia/Kolkata.
- GCS object versioning is enabled on the documents bucket.
- To restore a database:
  1. Create a clone from the desired backup in Cloud SQL.
  2. Update the `DATABASE_URL` secret to point to the clone.
  3. Restart the API deployment.

## Dependency Audit

Run the security audit script weekly:

```bash
./scripts/security-audit.sh
```

## Scaling

- Horizontal Pod Autoscaler is enabled on CPU > 70%.
- Increase GKE node pool size via Terraform or GKE Autopilot.
- Scale Redis Memorystore and Cloud SQL tier before major launches.

## Rollback

```bash
kubectl rollout undo deployment/fhv-api -n fhv
```

## DPDP Erasure Verification

1. Trigger account deletion via API.
2. Confirm `deleted_at` and `deletion_requested_at` are set.
3. After the 30-day window, verify hard-deletion cron removes PII and documents.
4. Check audit logs for `ACCOUNT_DELETED` and `PURGED` events.
