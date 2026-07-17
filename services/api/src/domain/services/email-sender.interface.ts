export interface IEmailSender {
  sendOtp(email: string, code: string): Promise<void>;
  sendPasswordReset(email: string, token: string): Promise<void>;
}
