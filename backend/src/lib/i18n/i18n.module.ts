import { Module } from '@nestjs/common';
import { I18nModule as NestI18nModule } from 'nestjs-i18n';
import { join } from 'path';


@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'nl',
      loaderOptions: {
        path: join(__dirname),
        watch: true,
      },
      resolvers: [], // TODO: add resolvers to get language from headers
      typesOutputPath: join(
        __dirname,
        '..',
        '..',
        '..',
        'src',
        'lib',
        'i18n',
        'generated.ts',
      ),
    }),
  ],
})
export class I18nModule {}
