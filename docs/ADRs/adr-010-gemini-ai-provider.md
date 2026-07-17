# ADR-010: Google Gemini as AI Provider

- **Status**: Proposed
- **Date**: 2026-07-17

## Context

AI features require OCR, document classification, entity extraction, summarization, and embeddings. The provider must be multimodal and run within contractual data-privacy terms.

## Decision

Use **Google Gemini Pro via Vertex AI** as the default provider. Wrap it with an `AIProvider` interface so OpenAI, AWS Bedrock, or self-hosted models can be swapped in.

## Consequences

- Multimodal prompts for PDFs and images reduce preprocessing complexity.
- Vertex AI provides VPC/contractual controls and IAM integration.
- No customer data is used to train models (subject to Enterprise DPA).

## Risks

- Model output hallucination or omission; all data is editable.
- Provider cost can spike with large documents; token quotas and caching required.

## Alternatives

- OpenAI GPT-4o / Azure OpenAI: strong alternatives; Gemini chosen for Vertex AI integration and India pricing.
- Self-hosted open-source model: deferred due to operational cost and accuracy.