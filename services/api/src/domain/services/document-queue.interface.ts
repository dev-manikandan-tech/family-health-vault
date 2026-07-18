export interface IDocumentQueue {
  enqueue(documentId: string): Promise<void>;
}
