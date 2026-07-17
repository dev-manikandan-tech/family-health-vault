export interface SocialProfile {
  provider: 'google' | 'apple';
  providerUserId: string;
  email: string;
  name?: string;
}

export interface IIdentityProvider {
  verifySocialToken(
    provider: 'google' | 'apple',
    token: string,
  ): Promise<SocialProfile>;
}
