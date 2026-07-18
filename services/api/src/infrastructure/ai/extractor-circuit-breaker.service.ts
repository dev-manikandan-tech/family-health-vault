import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExtractorCircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private open = false;

  constructor(private readonly configService: ConfigService) {}

  get isOpen(): boolean {
    const threshold = parseInt(
      this.configService.get<string>('EXTRACTOR_CIRCUIT_FAILURE_THRESHOLD') ??
        '5',
      10,
    );
    const resetSeconds = parseInt(
      this.configService.get<string>('EXTRACTOR_CIRCUIT_RESET_SECONDS') ?? '60',
      10,
    );

    if (this.open && this.lastFailureTime) {
      const elapsed = (Date.now() - this.lastFailureTime) / 1000;
      if (elapsed >= resetSeconds) {
        this.open = false;
        this.failures = 0;
      }
    }

    return this.open || this.failures >= threshold;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.open = false;
  }

  recordFailure(): void {
    this.failures += 1;
    this.lastFailureTime = Date.now();
    const threshold = parseInt(
      this.configService.get<string>('EXTRACTOR_CIRCUIT_FAILURE_THRESHOLD') ??
        '5',
      10,
    );
    if (this.failures >= threshold) {
      this.open = true;
    }
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      throw new Error('Extractor circuit breaker is open');
    }
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
