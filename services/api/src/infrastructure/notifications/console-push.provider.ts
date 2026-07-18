import { Injectable, Logger } from '@nestjs/common';
import {
  IPushProvider,
  PushPayload,
} from '../../domain/services/push-provider.interface';

@Injectable()
export class ConsolePushProvider implements IPushProvider {
  private readonly logger = new Logger(ConsolePushProvider.name);

  async send(payload: PushPayload): Promise<void> {
    this.logger.log('Push to %s: %s', payload.userId, payload.title);
  }
}
