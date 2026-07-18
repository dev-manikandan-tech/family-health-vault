import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProvider,
  EmailPayload,
} from '../../domain/services/email-provider.interface';

@Injectable()
export class ConsoleEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async send(payload: EmailPayload): Promise<void> {
    this.logger.log('Email to %s: %s', payload.to, payload.subject);
  }
}
