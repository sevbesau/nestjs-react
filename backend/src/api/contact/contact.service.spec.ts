import { faker } from '@faker-js/faker';
import { CaptchaService } from '@lib/captcha/captcha.service';
import { MyConfigModule } from '@lib/config/config.module';
import { DataBaseModule } from '@lib/database/database.module';
import { EmailService } from '@lib/email/email.service';
import contactRequestConfirmationTemplate from '@lib/email/templates/contactRequestConfirmation';
import contactRequestNotificationTemplate from '@lib/email/templates/contactRequestNotification';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import {
  anyString,
  instance,
  mock,
  objectContaining,
  verify,
  when,
} from 'ts-mockito';

import { Contact, ContactSchema } from './contact.schema';
import { ContactService } from './contact.service';
import { ContactRequestDto } from './dto/contact.create.dto';

describe('ContactService', () => {
  let module: TestingModule;
  let contactService: ContactService;
  let contactModel: Model<Contact>;
  const mockCaptchaService = mock(CaptchaService);
  const mockEmailService = mock(EmailService);

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MyConfigModule,
        DataBaseModule,
        MongooseModule.forFeature([
          { name: Contact.name, schema: ContactSchema },
        ]),
      ],
      providers: [ContactService],
    })
      .useMocker((token) => {
        if (token === CaptchaService) return instance(mockCaptchaService);
        if (token === EmailService) return instance(mockEmailService);
      })
      .compile();

    contactService = module.get<ContactService>(ContactService);
    contactModel = module.get<Model<Contact>>(getModelToken(Contact.name));
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
      when(mockCaptchaService.validateResponse(anyString())).thenResolve();
      const mockContactRequestDto: ContactRequestDto = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        message: faker.lorem.paragraphs(2),
        captchaResponse: faker.string.alpha(),
      };

      await contactService.newContactRequest(mockContactRequestDto);

      const { captchaResponse: _, ...contactRequestDto } =
        mockContactRequestDto;
      const contactRequestInDatabase = await contactModel.findOne(
        contactRequestDto,
      );

      expect(contactRequestInDatabase).toBeDefined();
      verify(
        mockEmailService.sendTemplateMail(
          contactRequestConfirmationTemplate,
          objectContaining(contactRequestDto),
          mockContactRequestDto.email,
        ),
      ).once();
      verify(
        mockEmailService.sendTemplateMail(
          contactRequestNotificationTemplate,
          objectContaining(contactRequestDto),
          anyString(),
        ),
      ).once();
    });
  });
});
