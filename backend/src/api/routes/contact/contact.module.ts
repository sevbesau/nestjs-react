import { CaptchaModule } from '@lib/captcha/captcha.module';
import { EmailModule } from '@lib/email/email.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactController } from './contact.controller';
import { ContactRepository } from './contact.repository';
import { Contact, ContactSchema } from './contact.schema';
import { ContactService } from './contact.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
    CaptchaModule,
    EmailModule,
  ],
  providers: [ContactService, ContactRepository],
  exports: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
