import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IIdentityProvider } from '../../domain/services/identity-provider.interface';
import { GoogleIdentityProvider } from './google.identity-provider';
import { AppleIdentityProvider } from './apple.identity-provider';
import { FakeIdentityProvider } from './fake.identity-provider';

@Injectable()
export class IdentityProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly googleProvider: GoogleIdentityProvider,
    private readonly appleProvider: AppleIdentityProvider,
    private readonly fakeProvider: FakeIdentityProvider,
  ) {}

  get(provider: 'google' | 'apple'): IIdentityProvider {
    const nodeEnv = this.configService.get<string>('auth.nodeEnv');
    if (nodeEnv === 'test') {
      return this.fakeProvider;
    }

    if (provider === 'google') {
      const googleClientId = this.configService.get<string>(
        'auth.googleClientId',
      );
      return googleClientId ? this.googleProvider : this.fakeProvider;
    }

    const appleClientId = this.configService.get<string>('auth.appleClientId');
    return appleClientId ? this.appleProvider : this.fakeProvider;
  }
}
