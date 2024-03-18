import { faker } from '@faker-js/faker';
import { CaptchaService } from '@lib/captcha/captcha.service';
import { EmailService } from '@lib/email/email.service';
import contactRequestConfirmationTemplate from '@lib/email/templates/contactRequestConfirmation';
import contactRequestNotificationTemplate from '@lib/email/templates/contactRequestNotification';
import { createMockConfigService } from '@lib/test/config';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ContactRepository } from './contact.repository';
import { ContactService } from './contact.service';
import { ContactRequestDto } from './dto/contact.create.dto';

describe('ContactService', () => {
  let module: TestingModule;
  let contactService: ContactService;
  const captchaService = { validateResponse: jest.fn() };
  const emailService = { sendTemplateMail: jest.fn() };
  const contactRepository = { createOne: jest.fn() };

  const configService = createMockConfigService({
    CONTACT_REQUEST_INBOX: faker.internet.email(),
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [ContactService],
    })
      .useMocker((token) => {
        if (token === ConfigService) return configService;
        if (token === CaptchaService) return captchaService;
        if (token === EmailService) return emailService;
        if (token === ContactRepository) return contactRepository;
      })
      .compile();

    contactService = module.get<ContactService>(ContactService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(contactService).toBeDefined();
  });

  describe('newContactRequest', () => {
    it('should be defined', () => {
      expect(contactService.newContactRequest).toBeDefined();
    });

    it('should save the contact request in the db and send out the confirmation and notification email', async () => {
      const mockContactRequestDto: ContactRequestDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        message: faker.lorem.paragraphs(2),
        captchaResponse: faker.string.alpha(),
      };

      await contactService.newContactRequest(mockContactRequestDto);

      const { captchaResponse, ...contactDto } = mockContactRequestDto;
      expect(captchaService.validateResponse).toBeCalledWith(captchaResponse);
      expect(contactRepository.createOne).toBeCalledWith(contactDto);
      expect(emailService.sendTemplateMail).toBeCalledWith(
        contactRequestConfirmationTemplate,
        contactDto,
        contactDto.email,
      );
      expect(emailService.sendTemplateMail).toBeCalledWith(
        contactRequestNotificationTemplate,
        contactDto,
        configService.getOrThrow('CONTACT_REQUEST_INBOX'),
      );
    });
  });
});
