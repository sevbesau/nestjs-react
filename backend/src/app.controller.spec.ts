import { createMockConfigService } from '@lib/test/config';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { instance } from 'ts-mockito';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const mockApiName = 'api name';
  const mockConfigService = createMockConfigService({
    API_NAME: mockApiName,
  });

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    })
      .useMocker((token) => {
        if (token === ConfigService) return instance(mockConfigService);
      })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the api name', () => {
      expect(appController.getHello()).toBe(mockApiName);
    });
  });
});
