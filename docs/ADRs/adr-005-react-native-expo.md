# ADR-005: React Native Expo

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

The mobile app must support iOS, Android, and tablets with offline capabilities. Native development for both platforms would double team size and effort.

## Decision

Use **React Native Expo** with the App Router, SQLite/WatermelonDB for offline, and Expo SecureStore for tokens.

## Consequences

- Single codebase for iOS, Android, and tablet layouts.
- Rich ecosystem for camera, file system, background tasks, and push notifications.

## Risks

- Binary size larger than pure native.
- Advanced features (DICOM viewing) may require native modules.

## Alternatives

- Flutter: rejected to align with team's React/TypeScript skills.
- Native iOS/Android: rejected due to cost and time to market.