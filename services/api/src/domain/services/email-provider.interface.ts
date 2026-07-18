export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export interface IEmailProvider {
  send(payload: EmailPayload): Promise<void>;
}
