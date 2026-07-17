# Mobile Architecture

## 1. Stack

- **Framework**: React Native Expo
- **Navigation**: Expo Router / React Navigation
- **State management**: Zustand or Redux Toolkit for UI; React Query for server state.
- **Offline database**: WatermelonDB over SQLite.
- **File system**: Expo FileSystem for local cache.
- **Secure storage**: Expo SecureStore for tokens and keys.
- **Background sync**: Expo BackgroundFetch + TaskManager.
- **Push notifications**: Expo Notifications.
- **Accessibility**: React Native Accessibility API, screen reader testing.

## 2. Offline-first design

### Local data model

WatermelonDB syncs a subset of server tables locally:

- `families`
- `persons`
- `medical_visits`
- `documents` (metadata only; files cached on demand)
- `tags`
- `timeline_events`
- `pending_uploads`
- `pending_mutations`

### Sync strategy

- **Pull**: `GET /api/v1/sync/changes?lastSyncAt=...` returns server-side mutations since last sync.
- **Push**: `POST /api/v1/sync/push` sends local pending mutations.
- **Conflict resolution**: last-write-wins by server timestamp; app shows conflict UI for important fields.
- **Background sync**: every 15 minutes when online; immediate sync after foregrounding.
- **Retry with backoff**: failed pushes retry with exponential backoff.

### Document cache

- Recently viewed documents downloaded and encrypted at rest on device.
- Max local cache size configurable (default 1 GB); LRU eviction.
- Thumbnails pre-generated server-side and cached.

### Offline capabilities

- View all synced metadata.
- Full-text search over cached metadata and OCR text.
- Upload files while offline: files staged in local filesystem, metadata queued.
- Create/edit visits and persons offline; queued for sync.

## 3. Tablet support

- Responsive layouts with `react-native-responsive-screen` or flex-based split views.
- Master-detail navigation for visits and documents.
- Optimized landscape orientation.

## 4. Accessibility

- WCAG 2.1 AA / ADA compliance where applicable.
- Screen reader labels on all interactive elements.
- Dynamic type scaling support.
- Color contrast ratio >= 4.5:1.
- Focus management and keyboard navigation on tablets.

## 5. Background tasks

- **Upload retry**: BackgroundFetch to retry pending uploads.
- **AI status polling**: poll for document processing status when online.
- **Push notifications**: new shares, AI completion, family invites.

## 6. Security on device

- JWT stored in SecureStore (iOS keychain / Android Keystore).
- SQLite encrypted using SQLCipher.
- Cached files encrypted at rest where platform supports it.
- Biometric lock option for app access.
- Screenshot and screen recording prevention for sensitive screens (where supported).

## 7. Performance

- Flatlist virtualization for timelines and document lists.
- Image thumbnails with progressive loading.
- Debounced search input.
- Pagination and infinite scroll.

## 8. Deep linking

- `familyhealthvault://families/:familyId/visits/:visitId`
- `familyhealthvault://shares/:token`
- Universal links for share emails.