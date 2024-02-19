import { I18nModule } from '@lib/i18n/i18n.module';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE, RouterModule } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientModule } from './client/client.module';
import { CaptchaModule } from './lib/captcha/captcha.module';
import { MyConfigModule } from './lib/config/config.module';
import { DataBaseModule } from './lib/database/database.module';
import { EmailModule } from './lib/email/email.module';
import { routes } from './routes';

@Module({
  imports: [
    // libs
    MyConfigModule,
    DataBaseModule,
    CaptchaModule,
    EmailModule,
    I18nModule,

    // routes
    ApiModule,
    ClientModule,
    RouterModule.register(routes),
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
