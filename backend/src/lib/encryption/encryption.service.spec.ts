import { createMockConfigService } from '@lib/test/config';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  const PRIVATE_KEY = 'private key';
  const configService = createMockConfigService({ PRIVATE_KEY });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    })
      .useMocker((token) => {
        if (token === ConfigService) return configService;
      })
      .compile();

    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(encryptionService).toBeDefined();
  });

  const password = 'superSecretTestPassword';

  describe('saltAndHasString', () => {
    it('should return the salt and hash separated by ":"', async () => {
      const hashedString = await encryptionService.saltAndHashString(password);
      const [salt, hash] = hashedString.split(':');
      expect(salt).toBeDefined();
      expect(hash).toBeDefined();
    });
  });

  describe('saltAndHasString', () => {
    it('should return true for a string and a matching hash', async () => {
      const hashedString = await encryptionService.saltAndHashString(password);
      const compareResult =
        await encryptionService.compareSaltedAndHashedString(
          password,
          hashedString,
        );
      expect(compareResult).toBe(true);
    });

    it('should return false for a non matching string and hash', async () => {
      const hashedString = await encryptionService.saltAndHashString(password);
      const compareResult =
        await encryptionService.compareSaltedAndHashedString(
          'randomStringThatDoesNotMatchThePassword',
          hashedString,
        );
      expect(compareResult).toBe(false);
    });

    it('should return false when the hash is does not contain a salt or hash', async () => {
      const compareResult =
        await encryptionService.compareSaltedAndHashedString(
          password,
          'randomStringThatIsNotAValidHash',
        );
      expect(compareResult).toBe(false);
    });
  });
});
