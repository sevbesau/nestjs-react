import { BadRequestException } from '@nestjs/common';

export class InvalidCaptchaException extends BadRequestException {
  constructor() {
    super('The captcha response was invalid');
  }
}
