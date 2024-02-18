import { CaptchaService } from '@lib/captcha/captcha.service';
import { EmailService } from '@lib/email/email.service';
import contactRequestConfirmationTemplate from '@lib/email/templates/contactRequestConfirmation';
import contactRequestNotificationTemplate from '@lib/email/templates/contactRequestNotification';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ContactRepository } from './contact.repository';
import { ContactRequestDto } from './dto/contact.create.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly configService: ConfigService,
    private readonly contactRepository: ContactRepository,
    private readonly captchaService: CaptchaService,
    private readonly emailService: EmailService,
  ) {}

  async newContactRequest(contactRequestDto: ContactRequestDto): Promise<void> {
    const { captchaResponse, ...contactDto } = contactRequestDto;
    await this.captchaService.validateResponse(captchaResponse);
    await this.contactRepository.createOne(contactDto);
    await Promise.all([
      this.emailService.sendTemplateMail(
        contactRequestConfirmationTemplate,
        contactDto,
        contactDto.email,
      ),
      this.emailService.sendTemplateMail(
        contactRequestNotificationTemplate,
        contactDto,
        this.configService.getOrThrow('CONTACT_REQUEST_INBOX'),
      ),
    ]);
    return;
  }
}
