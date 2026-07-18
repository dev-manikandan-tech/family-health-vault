import { Injectable } from '@nestjs/common';
import {
  IVirusScanner,
  VirusScanResult,
} from '../../domain/services/virus-scanner.interface';

@Injectable()
export class NoopVirusScanner implements IVirusScanner {
  async scan(): Promise<VirusScanResult> {
    return { isInfected: false };
  }
}
