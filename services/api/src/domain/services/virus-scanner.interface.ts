export interface VirusScanResult {
  isInfected: boolean;
  viruses?: string[];
}

export interface IVirusScanner {
  scan(buffer: Buffer): Promise<VirusScanResult>;
}
