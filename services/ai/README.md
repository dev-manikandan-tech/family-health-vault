# services/ai

Background AI worker for document processing.

## Responsibilities

- Consume Redis Streams events
- Download and preprocess documents
- OCR, classification, entity extraction, summarization
- Generate embeddings and timeline events
- Duplicate detection
- Update PostgreSQL with results

## Tech

- NestJS or Python (TBD; interface is language-agnostic)
- Pluggable `AIProvider`
- Zod/JSON schema output validation
- Vertex AI / Google Gemini client