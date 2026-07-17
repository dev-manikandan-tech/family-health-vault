export interface IPasswordResetService {
  generateToken(email: string): Promise<string>;
  validateToken(token: string): Promise<string>;
}
