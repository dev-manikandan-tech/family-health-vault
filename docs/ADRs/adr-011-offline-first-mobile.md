# ADR-011: Offline-First Mobile with WatermelonDB

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

Users in India may have intermittent connectivity. The mobile app must allow viewing records, uploading documents, and searching while offline.

## Decision

Use **WatermelonDB** over SQLite for local relational storage. Implement a sync engine that pulls server changes and pushes pending mutations. Files are staged locally and uploaded when online.

## Consequences

- Fast local queries and search.
- Seamless background sync.

## Risks

- Conflict resolution and deletion propagation must be carefully tested.
- Large local databases can bloat device storage; LRU file cache and pruning required.

## Alternatives

- Realm: commercial license and less community support.
- Pure AsyncStorage: rejected due to lack of relational query support.