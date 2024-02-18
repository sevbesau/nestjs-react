import { isProductionEnvironment, TConfig } from '@lib/config/config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';
import morgan from 'morgan';
import { patchNestJsSwagger } from 'nestjs-zod';
import { join } from 'path';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';

export const API_BASE_PATH = 'api';

patchNestJsSwagger();

async function bootstrap() {
  const logger = new Logger(bootstrap.name);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService<TConfig>);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(cookieParser(configService.getOrThrow('COOKIE_SECRET')));

  // app.setGlobalPrefix(`api/v${configService.getOrThrow('API_VERSION')}`);

  const morganLogger = new Logger('Morgan');
  app.use(
    morgan('dev', {
      stream: { write: (line) => morganLogger.log(line.replace(/\n$/, '')) },
    }),
  );

  app.enableCors({
    origin: configService
      .getOrThrow('ALLOWED_ORIGINS')
      .split(',')
      .map((url) => new URL(url).origin),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useStaticAssets(join(__dirname, '..', '..', 'frontend', 'dist'));

  // password protect swagger
  if (isProductionEnvironment)
    app.use(
      `/${configService.getOrThrow('DOCUMENTATION_PATH')}`,
      basicAuth({
        challenge: true,
        users: {
          [configService.getOrThrow('DOCUMENTATION_USER')]:
            configService.getOrThrow('DOCUMENTATION_PASSWORD'),
        },
      }),
    );
  // swagger config
  const config = new DocumentBuilder()
    .setTitle(configService.getOrThrow('API_NAME'))
    .setDescription(configService.getOrThrow('API_DESCRIPTION'))
    .setVersion(configService.getOrThrow('API_VERSION'))
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(
    `api/${configService.getOrThrow('DOCUMENTATION_PATH')}`,
    app,
    document,
  );

  const port = configService.getOrThrow('PORT');
  await app.listen(port);
  logger.log(
    `App listening on http://localhost:${port} or ${configService.getOrThrow(
      'BASE_URL',
    )}`,
  );
}
bootstrap();
