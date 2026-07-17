export interface IOtpService {
  generateCode(email: string): Promise<string>;
  verifyCode(email: string, code: string): Promise<boolean>;
}
