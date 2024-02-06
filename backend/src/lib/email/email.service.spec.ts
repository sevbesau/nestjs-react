import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import sendgridService from '@sendgrid/mail';
import { I18nService } from 'nestjs-i18n';
import { instance, mock } from 'ts-mockito';

import { FailedToSendEmailException } from './email.exceptions';
import { EmailService } from './email.service';
import testTemplate from './templates/test';

describe('EmailService', () => {
  let emailService: EmailService;
  const mockConfigService = mock(ConfigService);
  const mockI18N = mock(I18nService);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    })
      .useMocker((token) => {
        if (token === ConfigService) return instance(mockConfigService);
        if (token === I18nService) return instance(mockI18N);
      })
      .compile();

    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  describe('sendTemplateMail', () => {
    it('should be defined', () => {
      expect(emailService.sendTemplateMail).toBeDefined();
    });

    it('should render and send an email', async () => {
      const sendEmailSpy = jest
        .spyOn(emailService as any, 'sendEmail')
        .mockResolvedValue(null);
      const mockEmail = {
        subject: 'subject',
        html: 'html',
        text: 'text',
      };
      const renderTemplateSpy = jest
        .spyOn(emailService as any, 'renderTemplate')
        .mockReturnValue(mockEmail);
      const props = { hello: 'world' };
      const recipient = 'fake@email.com';

      await emailService.sendTemplateMail(testTemplate, props, recipient);

      expect(renderTemplateSpy).toBeCalledWith(testTemplate, props, undefined);
      expect(sendEmailSpy).toBeCalledWith(
        recipient,
        mockEmail.subject,
        mockEmail.text,
        mockEmail.html,
      );
      jest.spyOn(emailService as any, 'sendEmail').mockRestore();
      jest.spyOn(emailService as any, 'renderTemplate').mockRestore();
    });
  });

  describe('sendEmail', () => {
    it('should be defined', () => {
      expect(emailService['sendEmail']).toBeDefined();
    });

    it('should send an email using the sendgrid api', async () => {
      const sendGridSpy = jest
        .spyOn(sendgridService, 'send')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .mockResolvedValue(null);
      const mockSubject = 'subject';
      const mockHtml = 'html';
      const mockText = 'text';
      const mockRecipient = 'fake@email.com';

      await emailService['sendEmail'](
        mockRecipient,
        mockSubject,
        mockText,
        mockHtml,
      );

      const msg = sendGridSpy.mock.lastCall;

      expect(msg).toMatchSnapshot();
      jest.spyOn(sendgridService, 'send').mockRestore();
    });

    it('should throw when sending fails', async () => {
      jest.spyOn(sendgridService, 'send').mockRejectedValue(new Error());
      const mockSubject = 'subject';
      const mockHtml = 'html';
      const mockText = 'text';
      const mockRecipient = 'fake@email.com';

      await expect(
        emailService['sendEmail'](
          mockRecipient,
          mockSubject,
          mockText,
          mockHtml,
        ),
      ).rejects.toThrow(FailedToSendEmailException);

      jest.spyOn(sendgridService, 'send').mockRestore();
    });
  });

  describe('renderTemplate', () => {
    it('should be defined', () => {
      expect(emailService['renderTemplate']).toBeDefined();
    });

    it('should render a template and return html, text and the subject', () => {
      const { html, text, subject } = emailService['renderTemplate'](
        testTemplate,
        { hello: 'world' },
      );

      expect(subject).toBe('subject');
      expect(text).toBe('world');
      expect(html).toMatchSnapshot();
    });
  });

  describe('createEmailContext', () => {
    it('should be defined', () => {
      expect(emailService['createEmailContext']).toBeDefined();
    });

    it('should create a context object for the email template class', () => {
      const context = emailService['createEmailContext']();

      expect(context.i18n).toBeDefined();
      expect(context.configService).toBeDefined();
      expect(context.lang).toBeDefined();
    });
  });
});
