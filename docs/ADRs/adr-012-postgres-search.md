# ADR-012: PostgreSQL FTS and pgvector for Search

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

Users need full-text search across file names, OCR text, extracted entities, and (future) semantic search over document meaning.

## Decision

Use PostgreSQL `tsvector` for full-text search and `pgvector` for semantic embeddings. Maintain a materialized view `search_documents` with a GIN index. Cache frequent queries in Redis.

## Consequences

- No additional search service to operate at MVP scale.
- Semantic search available as soon as embeddings are generated.

## Risks

- Materialized view refresh can become expensive; move to trigger-based incremental updates or `paradedb` at scale.
- pgvector `ivfflat` index has recall/latency tradeoffs; monitor and consider `hnsw`.

## Alternatives

- Elasticsearch/OpenSearch: rejected to reduce ops overhead; re-evaluate at 10M+ docs.
- Algolia: SaaS cost and data residency concerns.