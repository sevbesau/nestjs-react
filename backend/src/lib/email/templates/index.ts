import { TConfig } from '@lib/config/config';
import { I18nTranslations } from '@lib/i18n/generated';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

export interface EmailTemplateContext {
  i18n: I18nService<I18nTranslations>;
  configService: ConfigService<TConfig>;
  lang: string;
}

export class EmailTemplate<T> {
  constructor(
    readonly subject: (context: EmailTemplateContext) => string,
    readonly component: (
      props: T,
      context?: EmailTemplateContext,
    ) => JSX.Element,
  ) {}
}

export type PropsOfTemplate<T extends EmailTemplate<unknown>> = Parameters<
  T['component']
>[0];
