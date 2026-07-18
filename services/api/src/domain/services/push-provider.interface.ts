export interface PushPayload {
  userId: string;
  title: string;
  body: string;
}

export interface IPushProvider {
  send(payload: PushPayload): Promise<void>;
}
