export function isGeminiEnabled(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  return process.env.EXTRACTOR_PROVIDER === 'gemini';
}
