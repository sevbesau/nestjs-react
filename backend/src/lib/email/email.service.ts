import { TConfig } from '@lib/config/config';
import { I18nTranslations } from '@lib/i18n/generated';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import sendgridService, { MailDataRequired } from '@sendgrid/mail';
import { exec } from 'child_process';
import { writeFile } from 'fs';
import { I18nService } from 'nestjs-i18n';
import { file } from 'tmp';

import { FailedToSendEmailException } from './email.exceptions';
import {
  EmailTemplate,
  EmailTemplateContext,
  PropsOfTemplate,
} from './templates';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService<TConfig>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {
    // Useful for developing emails and opening a preview in the browser
    //     const { html } = this.renderTemplate(contactRequestNotificationTemplate, {
    //       email: 'seppe@siliconminds.be',
    //       firstName: 'seppe',
    //       lastName: 'van besauw',
    //       message: `hello world,
    // this is a beautiful day.
    // How are you?
    // Best regards.`,
    //     });
    // this.openHtmlInBrowser(html);
  }

  async onModuleInit() {
    sendgridService.setApiKey(this.configService.getOrThrow('SENDGRID_KEY'));
  }

  async sendTemplateMail<T extends EmailTemplate<unknown>>(
    template: T,
    props: PropsOfTemplate<T>,
    to: string | string[],
    options?: { lang?: string },
  ) {
    const { html, text, subject } = this.renderTemplate(
      template,
      props,
      options?.lang,
    );
    return this.sendEmail(to, subject, text, html);
  }

  private async sendEmail(
    to: string | string[],
    subject: string,
    text: string,
    html: string,
  ) {
    const msg: MailDataRequired = {
      to,
      from: {
        name: this.configService.getOrThrow('MAILS_FROM_NAME'),
        email: this.configService.getOrThrow('MAILS_FROM_EMAIL'),
      },
      subject,
      text,
      html,
    };
    try {
      await sendgridService.send(msg);
    } catch (error) {
      throw new FailedToSendEmailException();
    }
  }

  private renderTemplate<T extends EmailTemplate<unknown>>(
    template: T,
    props: PropsOfTemplate<T>,
    lang?: string,
  ) {
    const context = this.createEmailContext(lang);
    const componentWithProps = template.component(props, context);
    const html = render(componentWithProps, { pretty: true });
    const text = render(componentWithProps, { plainText: true });
    const subject = template.subject(context);

    return { html, text, subject };
  }

  private createEmailContext(lang = 'nl'): EmailTemplateContext {
    return {
      i18n: this.i18n,
      configService: this.configService,
      lang,
    };
  }

  private openHtmlInBrowser(html: string) {
    file((err, path, _fd, cleanupCallback) => {
      if (err) throw err;
      writeFile(path, html, (err) => {
        if (err) throw err;
        this.openUrl(`file://${path}`);
      });
      setTimeout(cleanupCallback, 10_000);
    });
  }

  private openUrl(url: string) {
    const openUrl =
      process.platform == 'darwin'
        ? 'open'
        : process.platform == 'win32'
        ? 'start'
        : 'xdg-open';
    exec(`${openUrl} ${url}`);
  }
}
