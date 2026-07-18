export function isBullMqEnabled(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  return process.env.DOCUMENT_QUEUE_PROVIDER === 'bullmq';
}
