import { I18nModule } from '@lib/i18n/i18n.module';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { AuthModule } from './api/auth/auth.module';
import { ContactModule } from './api/contact/contact.module';
import { UsersModule } from './api/users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CaptchaModule } from './lib/captcha/captcha.module';
import { MyConfigModule } from './lib/config/config.module';
import { DataBaseModule } from './lib/database/database.module';
import { EmailModule } from './lib/email/email.module';

@Module({
  imports: [
    // libs
    MyConfigModule,
    DataBaseModule,
    CaptchaModule,
    EmailModule,
    I18nModule,
    // routes
    AuthModule,
    UsersModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Use zod to validate incoming data
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    // Use zod to validate outgoing data
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
