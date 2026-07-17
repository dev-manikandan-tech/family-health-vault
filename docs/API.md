# API Design

## 1. Overview

- **Protocol**: REST over HTTPS
- **Base path**: `/api/v1`
- **Content type**: `application/json`
- **Authentication**: `Authorization: Bearer <supabase_access_token>`
- **Versioning**: URL path versioning
- **Idempotency**: `Idempotency-Key` header for mutation endpoints

## 2. Common conventions

### Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes | Supabase JWT |
| `Content-Type` | Yes | `application/json` (except multipart) |
| `X-Request-ID` | No | UUID for tracing |
| `X-Client-Version` | No | e.g. `mobile/1.2.0` |
| `Accept-Language` | No | e.g. `en-IN` |
| `Idempotency-Key` | No | UUID for retry safety |

### Pagination

List endpoints use cursor-based pagination:

```json
{
  "data": [...],
  "nextCursor": "base64(cursor)",
  "hasMore": true
}
```

### Error response

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "code": "INSUFFICIENT_FAMILY_PERMISSIONS",
  "message": "You do not have permission to access this family."
}
```

Common error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `DUPLICATE_RESOURCE`, `FILE_TOO_LARGE`, `AI_UNAVAILABLE`, `SHARE_EXPIRED`, `TENANT_ISOLATION_VIOLATION`.

### Rate limits

| Scope | Limit |
|---|---|
| Per user | 100 req/min |
| Per user uploads | 10 req/min |
| Per user AI-heavy calls | 5 req/min |
| Per family | 1,000 req/min |
| Per IP | 300 req/min |

## 3. Authentication endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/refresh` | Refresh access token via Supabase refresh token |
| POST | `/api/v1/auth/logout` | Revoke session |
| GET | `/api/v1/auth/me` | Get current user and active families |
| POST | `/api/v1/auth/mfa/enroll` | Enroll TOTP (future) |
| POST | `/api/v1/auth/mfa/verify` | Verify TOTP (future) |

## 4. Family endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/families` | List families for current user |
| POST | `/api/v1/families` | Create a new family |
| GET | `/api/v1/families/:familyId` | Get family details |
| PATCH | `/api/v1/families/:familyId` | Update family name/settings |
| DELETE | `/api/v1/families/:familyId` | Soft delete family |
| GET | `/api/v1/families/:familyId/members` | List members |
| POST | `/api/v1/families/:familyId/members` | Invite a user by email/phone |
| PATCH | `/api/v1/families/:familyId/members/:memberId` | Update role/status |
| DELETE | `/api/v1/families/:familyId/members/:memberId` | Remove member |

## 5. Person endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/families/:familyId/persons` | List persons |
| POST | `/api/v1/families/:familyId/persons` | Add a person |
| GET | `/api/v1/families/:familyId/persons/:personId` | Get person |
| PATCH | `/api/v1/families/:familyId/persons/:personId` | Update person |
| DELETE | `/api/v1/families/:familyId/persons/:personId` | Soft delete person |

## 6. Visit endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/families/:familyId/visits` | List visits |
| POST | `/api/v1/families/:familyId/visits` | Create a visit |
| GET | `/api/v1/families/:familyId/visits/:visitId` | Get visit + documents |
| PATCH | `/api/v1/families/:familyId/visits/:visitId` | Update visit |
| DELETE | `/api/v1/families/:familyId/visits/:visitId` | Soft delete visit |
| GET | `/api/v1/families/:familyId/timeline` | Get timeline events |

## 7. Document endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/families/:familyId/documents` | List documents |
| POST | `/api/v1/families/:familyId/documents/upload-url` | Request signed upload URL |
| POST | `/api/v1/families/:familyId/documents` | Create document metadata after upload |
| GET | `/api/v1/families/:familyId/documents/:documentId` | Get metadata |
| PATCH | `/api/v1/families/:familyId/documents/:documentId` | Update metadata/category |
| DELETE | `/api/v1/families/:familyId/documents/:documentId` | Soft delete |
| POST | `/api/v1/families/:familyId/documents/:documentId/restore` | Restore soft-deleted |
| GET | `/api/v1/families/:familyId/documents/:documentId/download` | Get signed download URL |
| POST | `/api/v1/families/:familyId/documents/:documentId/share` | Create share link |
| GET | `/api/v1/families/:familyId/documents/:documentId/shares` | List shares |
| DELETE | `/api/v1/families/:familyId/documents/:documentId/shares/:shareId` | Revoke share |

### Upload flow example

**Step 1: Request upload URL**

```http
POST /api/v1/families/550e8400-e29b-41d4-a716-446655440000/documents/upload-url
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "fileName": "blood_test_2024.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 2048576,
  "personId": "550e8400-e29b-41d4-a716-446655440001",
  "visitId": "550e8400-e29b-41d4-a716-446655440002",
  "documentCategory": "lab_report"
}
```

**Response:**

```json
{
  "documentId": "550e8400-e29b-41d4-a716-446655440003",
  "uploadUrl": "https://storage.googleapis.com/...?X-Goog-Signature=...",
  "uploadMethod": "PUT",
  "expiresAt": "2024-01-01T12:05:00Z"
}
```

**Step 2: Upload file**

```http
PUT <uploadUrl>
Content-Type: application/pdf

<binary file>
```

**Step 3: Confirm upload**

```http
POST /api/v1/families/550e8400-e29b-41d4-a716-446655440000/documents
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "documentId": "550e8400-e29b-41d4-a716-446655440003",
  "checksumSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

## 8. AI endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/families/:familyId/documents/:documentId/extract` | Trigger/re-run extraction |
| GET | `/api/v1/families/:familyId/documents/:documentId/extractions` | Get extracted entities |
| POST | `/api/v1/families/:familyId/visits/:visitId/summarize` | Generate visit summary |
| GET | `/api/v1/families/:familyId/visits/:visitId/summary` | Get cached summary |
| POST | `/api/v1/families/:familyId/search` | Search visits/documents |
| GET | `/api/v1/families/:familyId/search/suggestions` | Query suggestions |
| POST | `/api/v1/families/:familyId/ai/duplicates` | Find duplicate documents |

### Search example

```http
POST /api/v1/families/550e8400-e29b-41d4-a716-446655440000/search
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "query": "cholesterol test after January 2023",
  "filters": {
    "personIds": ["550e8400-e29b-41d4-a716-446655440001"],
    "documentCategories": ["lab_report"],
    "dateFrom": "2023-01-01",
    "dateTo": "2024-12-31"
  },
  "includeSemantic": true,
  "includeExtractedEntities": true,
  "limit": 20,
  "cursor": null
}
```

## 9. Sharing endpoints (public)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/shares/:token` | Access shared resource |
| GET | `/api/v1/shares/:token/download` | Download shared document |

Public share endpoints bypass JWT but validate the share token and expiration.

## 10. Admin endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/users` | List users (platform admin) |
| GET | `/api/v1/admin/families` | List families |
| GET | `/api/v1/admin/audit-logs` | Query audit logs |
| POST | `/api/v1/admin/users/:userId/disable` | Disable user |
| POST | `/api/v1/admin/families/:familyId/restore` | Restore deleted family |

## 11. WebSocket / events

- `wss://api.example.com/ws/v1/notifications` — real-time notifications for new shares, AI completion, sync events.
- Events delivered via Redis Pub/Sub and broadcast through Socket.io or native WS.

## 12. SDK / mobile sync endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/sync/changes` | Get changes since `lastSyncAt` |
| POST | `/api/v1/sync/push` | Push offline changes |
| GET | `/api/v1/sync/status` | Get sync status |