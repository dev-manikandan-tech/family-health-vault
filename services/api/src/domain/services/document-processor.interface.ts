export interface IDocumentProcessor {
  process(documentId: string): Promise<void>;
}
