import { TConfig } from '@lib/config/config';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InvalidCaptchaException } from './captcha.exceptions';

@Injectable()
export class CaptchaService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<TConfig>,
  ) {}

  async validateResponse(captchaResponse: string): Promise<void> {
    if (this.configService.getOrThrow('BYPASS_CAPTCHA')) return;

    let success: boolean;
    try {
      const { data } = await this.httpService.axiosRef({
        url: 'https://www.google.com/recaptcha/api/siteverify',
        method: 'POST',
        data: {
          form: {
            secret: this.configService.getOrThrow('CAPTCHA_PRIVATE_KEY'),
            response: captchaResponse,
          },
        },
      });
      success = data.success ?? false;
    } catch (error) {
      throw new InternalServerErrorException(error.response?.data);
    }

    if (!success) throw new InvalidCaptchaException();
    return;
  }
}
