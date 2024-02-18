import { CaptchaModule } from '@lib/captcha/captcha.module';
import { EmailModule } from '@lib/email/email.module';
import { EncryptionModule } from '@lib/encryption/encryption.module';
import { TokensModule } from '@lib/tokens/tokens.module';
import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    TokensModule,
    EmailModule,
    CaptchaModule,
    EncryptionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
