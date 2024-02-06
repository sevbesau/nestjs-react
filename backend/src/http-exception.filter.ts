import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const message = exception.message;
    const { errors } = exception.getResponse() as { errors: ZodError };

    // TODO: maybe don't log every exception, maybe only log exceptions caused by issues on the backend.
    // we don't want to pollute the log every time a client sends incorrect data for example.

    this.logger.error(`"${request.url}": ${exception}`);
    if (errors) this.logger.debug(JSON.stringify(errors, null, 2));
    this.logger.debug(exception.stack);

    response.status(statusCode).json({
      statusCode,
      message,
    });
  }
}
