import { isProductionEnvironment } from '@lib/config/config';
import { InternalServerErrorException } from '@nestjs/common';

export class FailedToSendEmailException extends InternalServerErrorException {
  constructor() {
    super(
      isProductionEnvironment
        ? 'Something went wrong...'
        : 'Failed to send email using sendgrid',
    );
  }
}
