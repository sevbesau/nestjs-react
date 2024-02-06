import { createMockConfigService } from '@lib/test/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { instance } from 'ts-mockito';

import { InvalidCaptchaException } from './captcha.exceptions';
import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  let captchaService: CaptchaService;
  let httpService: HttpService;

  const mockConfigService = createMockConfigService({
    CAPTCHA_PRIVATE_KEY: 'captchaPrivateKey',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [CaptchaService],
    })
      .useMocker((token) => {
        if (token === ConfigService) return instance(mockConfigService);
      })
      .compile();

    captchaService = module.get<CaptchaService>(CaptchaService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(captchaService).toBeDefined();
  });

  describe('validateResponse', () => {
    it('should be defined', () => {
      expect(captchaService.validateResponse).toBeDefined();
    });

    it('should resolve when the captcha response is valid', async () => {
      jest
        .spyOn(httpService, 'axiosRef')
        .mockResolvedValueOnce({ data: { success: true } });

      await captchaService.validateResponse('response');
    });

    it('should throw when the captcha response is invalid', async () => {
      jest
        .spyOn(httpService, 'axiosRef')
        .mockResolvedValueOnce({ data: { success: false } });

      await expect(captchaService.validateResponse('response')).rejects.toThrow(
        InvalidCaptchaException,
      );
    });
  });
});
