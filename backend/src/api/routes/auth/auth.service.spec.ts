/* eslint-disable @typescript-eslint/ban-ts-comment */
import { faker } from '@faker-js/faker';
import { InvalidCaptchaException } from '@lib/captcha/captcha.exceptions';
import { CaptchaService } from '@lib/captcha/captcha.service';
import { EmailService } from '@lib/email/email.service';
import otpTemplate from '@lib/email/templates/otp';
import { EncryptionService } from '@lib/encryption/encryption.service';
import { TokensService } from '@lib/tokens/tokens.service';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from '../users/users.service';
import { WebshopsService } from '../webshops/webshops.service';
import {
  DuplicateEmailException,
  ExpiredOtpException,
  IncorrectPasswordException,
  InvalidRefreshTokenException,
  MissingRefreshTokenException,
} from './auth.exceptions';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  const usersService: Partial<UsersService> = {};
  const webshopsService: Partial<WebshopsService> = {};
  const emailService: Partial<EmailService> = {};
  const captchaService: Partial<CaptchaService> = {};
  const encryptionService: Partial<EncryptionService> = {};
  const tokensService: Partial<TokensService> = {};

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 22, 2));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === UsersService) return usersService;
        if (token === WebshopsService) return webshopsService;
        if (token === EmailService) return emailService;
        if (token === CaptchaService) return captchaService;
        if (token === EncryptionService) return encryptionService;
        if (token === TokensService) return tokensService;
      })
      .compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signIn', () => {
    it('should be defined', () => {
      expect(authService.signIn).toBeDefined();
    });

    it('should return the userId and send an otp email when a user is found', async () => {
      const user = {
        email: faker.internet.email(),
        _id: faker.database.mongodbObjectId(),
      };
      const otp = { password: 123456, expiresAt: Date.now() };
      usersService.findByEmail = jest.fn().mockResolvedValue(user);
      authService['generateOtpAndSetOnUser'] = jest.fn().mockResolvedValue(otp);
      emailService.sendTemplateMail = jest.fn();

      const result = await authService.signIn({ email: user.email });

      expect(result).toEqual({ userId: user._id });
      expect(usersService.findByEmail).toBeCalledWith(user.email);
      expect(authService['generateOtpAndSetOnUser']).toBeCalledWith(user._id);
      expect(emailService.sendTemplateMail).toBeCalledWith(
        otpTemplate,
        { otp: otp.password },
        user.email,
      );
    });
  });

  describe('validateOtp', () => {
    it('should be defined', () => {
      expect(authService.validateOtp).toBeDefined();
    });

    it('should set a token in the headers and the cookies and clear the otps when a correct password is given', async () => {
      const response = 'response';
      const user = {
        _id: faker.database.mongodbObjectId(),
        verified: true,
        otps: [
          {
            password: faker.number.int({ min: 100_000, max: 999_999 }),
            expiresAt: Date.now() + 10_000,
          },
        ],
      };
      const validateOtpRequest = {
        password: user.otps[0].password,
        userId: user._id,
      };
      usersService.findById = jest.fn().mockResolvedValue(user);
      encryptionService.compareSaltedAndHashedString = jest
        .fn()
        .mockResolvedValue(true);
      usersService.clearOtpsById = jest.fn();
      usersService.verifyById = jest.fn();
      tokensService.setAccessTokenInHeader = jest.fn();
      tokensService.setRefreshTokenInCookie = jest.fn();

      // @ts-ignore
      await authService.validateOtp(response, validateOtpRequest);

      expect(usersService.findById).toBeCalledWith(user._id);
      expect(encryptionService.compareSaltedAndHashedString).toBeCalledWith(
        validateOtpRequest.password,
        user.otps[0].password,
      );
      expect(usersService.clearOtpsById).toBeCalledWith(user._id);
      expect(usersService.verifyById).not.toBeCalled();
      expect(tokensService.setAccessTokenInHeader).toBeCalledWith(
        response,
        user._id,
      );
      expect(tokensService.setRefreshTokenInCookie).toBeCalledWith(
        response,
        user._id,
      );
    });

    it('should throw when the password is incorrect', async () => {
      const response = 'response';
      const user = {
        _id: faker.database.mongodbObjectId(),
        otps: [
          {
            password: faker.number.int({ min: 100_000, max: 999_999 }),
            expiresAt: Date.now() + 10_000,
          },
        ],
      };
      const validateOtpRequest = {
        password: user.otps[0].password,
        userId: user._id,
      };
      usersService.findById = jest.fn().mockResolvedValue(user);
      encryptionService.compareSaltedAndHashedString = jest
        .fn()
        .mockResolvedValue(false);
      usersService.clearOtpsById = jest.fn();
      usersService.verifyById = jest.fn();
      tokensService.setAccessTokenInHeader = jest.fn();
      tokensService.setRefreshTokenInCookie = jest.fn();

      await expect(
        // @ts-ignore
        authService.validateOtp(response, validateOtpRequest),
      ).rejects.toThrow(new IncorrectPasswordException());

      expect(usersService.clearOtpsById).not.toBeCalled();
      expect(usersService.verifyById).not.toBeCalled();
      expect(tokensService.setAccessTokenInHeader).not.toBeCalled();
      expect(tokensService.setRefreshTokenInCookie).not.toBeCalled();
    });

    it('should throw when the otp is expired', async () => {
      const response = 'response';
      const user = {
        _id: faker.database.mongodbObjectId(),
        otps: [
          {
            password: faker.number.int({ min: 100_000, max: 999_999 }),
            expiresAt: Date.now() - 10_000,
          },
        ],
      };
      const validateOtpRequest = {
        password: user.otps[0].password,
        userId: user._id,
      };
      usersService.findById = jest.fn().mockResolvedValue(user);
      encryptionService.compareSaltedAndHashedString = jest
        .fn()
        .mockResolvedValue(true);
      usersService.clearOtpsById = jest.fn();
      usersService.verifyById = jest.fn();
      tokensService.setAccessTokenInHeader = jest.fn();
      tokensService.setRefreshTokenInCookie = jest.fn();

      await expect(
        // @ts-ignore
        authService.validateOtp(response, validateOtpRequest),
      ).rejects.toThrow(new ExpiredOtpException());

      expect(usersService.clearOtpsById).not.toBeCalled();
      expect(usersService.verifyById).not.toBeCalled();
      expect(tokensService.setAccessTokenInHeader).not.toBeCalled();
      expect(tokensService.setRefreshTokenInCookie).not.toBeCalled();
    });

    it('should verify the user when the password matches and he is not verified', async () => {
      const response = 'response';
      const user = {
        _id: faker.database.mongodbObjectId(),
        verified: false,
        otps: [
          {
            password: faker.number.int({ min: 100_000, max: 999_999 }),
            expiresAt: Date.now() + 10_000,
          },
        ],
      };
      const validateOtpRequest = {
        password: user.otps[0].password,
        userId: user._id,
      };
      usersService.findById = jest.fn().mockResolvedValue(user);
      encryptionService.compareSaltedAndHashedString = jest
        .fn()
        .mockResolvedValue(true);
      usersService.clearOtpsById = jest.fn();
      usersService.verifyById = jest.fn();
      tokensService.setAccessTokenInHeader = jest.fn();
      tokensService.setRefreshTokenInCookie = jest.fn();

      // @ts-ignore
      await authService.validateOtp(response, validateOtpRequest);

      expect(usersService.verifyById).toBeCalledWith(user._id);
    });
  });

  describe('refresh', () => {
    it('should be defined', () => {
      expect(authService.refresh).toBeDefined();
    });

    it('should generate and send a new token for valid refresh tokens', async () => {
      const request = 'request';
      const response = 'response';
      const refreshToken = 'refreshToken';
      const session = { sub: faker.database.mongodbObjectId() };
      tokensService.getRefreshTokenFromCookie = jest
        .fn()
        .mockReturnValue(refreshToken);
      tokensService.parseRefreshToken = jest.fn().mockResolvedValue(session);
      tokensService.setAccessTokenInHeader = jest.fn();

      // @ts-ignore
      await authService.refresh(request, response);

      expect(tokensService.getRefreshTokenFromCookie).toBeCalledWith(request);
      expect(tokensService.parseRefreshToken).toBeCalledWith(refreshToken);
      expect(tokensService.setAccessTokenInHeader).toBeCalledWith(
        response,
        session.sub,
      );
    });

    it('should throw when no refresh token is set', async () => {
      const request = 'request';
      const response = 'response';
      const refreshToken = undefined;
      const session = { sub: faker.database.mongodbObjectId() };
      tokensService.getRefreshTokenFromCookie = jest
        .fn()
        .mockReturnValue(refreshToken);
      tokensService.parseRefreshToken = jest.fn().mockResolvedValue(session);
      tokensService.setAccessTokenInHeader = jest.fn();

      await expect(
        // @ts-ignore
        authService.refresh(request, response),
      ).rejects.toThrow(new MissingRefreshTokenException());

      expect(tokensService.parseRefreshToken).not.toBeCalled();
      expect(tokensService.setAccessTokenInHeader).not.toBeCalled();
    });

    it('should throw when the refresh token is invalid', async () => {
      const request = 'request';
      const response = 'response';
      const refreshToken = 'refreshToken';
      const session = undefined;
      tokensService.getRefreshTokenFromCookie = jest
        .fn()
        .mockReturnValue(refreshToken);
      tokensService.parseRefreshToken = jest.fn().mockResolvedValue(session);
      tokensService.setAccessTokenInHeader = jest.fn();

      await expect(
        // @ts-ignore
        authService.refresh(request, response),
      ).rejects.toThrow(new InvalidRefreshTokenException());

      expect(tokensService.setAccessTokenInHeader).not.toBeCalled();
    });
  });

  describe('signOut', () => {
    it('should be defined', () => {
      expect(authService.signOut).toBeDefined();
    });

    it('should increment the token version and clear the refresh token cookie', async () => {
      const response = 'response';
      const session = { sub: faker.database.mongodbObjectId() };
      usersService.incrementTokenVersionById = jest.fn();
      tokensService.clearRefreshToken = jest.fn();

      // @ts-ignore
      await authService.signOut(session, response);

      expect(usersService.incrementTokenVersionById).toBeCalledWith(
        session.sub,
      );
      expect(tokensService.clearRefreshToken).toBeCalledWith(response);
    });
  });

  describe('signUp', () => {
    it('should be defined', () => {
      expect(authService.signUp).toBeDefined();
    });

    it('should create the user, generate an otp, send the otp mail and return the userId on success', async () => {
      const captchaResponse = 'captchaResponse';
      const signUpDto = {
        email: faker.internet.email(),
        captchaResponse,
      };
      const user = {
        email: signUpDto.email,
        _id: faker.database.mongodbObjectId(),
      };
      const otp = {
        password: faker.number.int({ min: 100_000, max: 999_999 }),
      };
      usersService.isDuplicateEmail = jest.fn().mockResolvedValue(false);
      captchaService.validateResponse = jest.fn();
      usersService.createOne = jest.fn().mockResolvedValue(user);
      authService['generateOtpAndSetOnUser'] = jest.fn().mockResolvedValue(otp);
      emailService.sendTemplateMail = jest.fn();

      // @ts-ignore
      const response = await authService.signUp(signUpDto);

      expect(response).toEqual({ userId: user._id });
      expect(usersService.isDuplicateEmail).toBeCalledWith(user.email);
      expect(captchaService.validateResponse).toBeCalledWith(
        signUpDto.captchaResponse,
      );
      expect(usersService.createOne).toBeCalledWith(signUpDto);
      expect(authService['generateOtpAndSetOnUser']).toBeCalledWith(user._id);
      expect(emailService.sendTemplateMail).toBeCalledWith(
        otpTemplate,
        { otp: otp.password },
        user.email,
      );
    });

    it('should throw for duplicate emails', async () => {
      const signUpDto = {
        email: faker.internet.email(),
      };

      usersService.isDuplicateEmail = jest.fn().mockResolvedValue(true);
      captchaService.validateResponse = jest.fn();
      usersService.createOne = jest.fn();
      authService['generateOtpAndSetOnUser'] = jest.fn();
      emailService.sendTemplateMail = jest.fn();

      await expect(
        // @ts-ignore
        authService.signUp(signUpDto),
      ).rejects.toThrow(new DuplicateEmailException());

      expect(captchaService.validateResponse).not.toBeCalled();
      expect(usersService.createOne).not.toBeCalled();
      expect(authService['generateOtpAndSetOnUser']).not.toBeCalled();
      expect(emailService.sendTemplateMail).not.toBeCalled();
    });

    it('should throw for an invalid captcha', async () => {
      const captchaResponse = 'captchaResponse';
      const signUpDto = {
        email: faker.internet.email(),
        captchaResponse,
      };
      usersService.isDuplicateEmail = jest.fn().mockResolvedValue(false);
      captchaService.validateResponse = jest
        .fn()
        .mockRejectedValue(new InvalidCaptchaException());
      usersService.createOne = jest.fn();
      authService['generateOtpAndSetOnUser'] = jest.fn();
      emailService.sendTemplateMail = jest.fn();

      // @ts-ignore
      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        new InvalidCaptchaException(),
      );

      expect(usersService.createOne).not.toBeCalled();
      expect(authService['generateOtpAndSetOnUser']).not.toBeCalled();
      expect(emailService.sendTemplateMail).not.toBeCalled();
    });
  });

  describe('getLoggedInUser', () => {
    it('should be defined', () => {
      expect(authService.getLoggedInUser).toBeDefined();
    });

    it('should return the logged in user', async () => {
      const user = { _id: faker.database.mongodbObjectId(), foo: 'bar' };
      const session = { sub: user._id };
      usersService.findById = jest.fn().mockResolvedValue(user);
      webshopsService.findByUserId = jest.fn().mockRejectedValue(new Error());

      // @ts-ignore
      const result = await authService.getLoggedInUser(session);

      expect(result).toEqual({
        ...user,
        webshop: undefined,
      });
      expect(webshopsService.findByUserId).toBeCalledWith(user._id);
    });

    it('should also include the webshop if the user has a webshop', async () => {
      const user = { _id: faker.database.mongodbObjectId(), foo: 'bar' };
      const session = { sub: user._id };
      const webshop = 'webshop';
      usersService.findById = jest.fn().mockResolvedValue(user);
      webshopsService.findByUserId = jest.fn().mockResolvedValue(webshop);

      // @ts-ignore
      const result = await authService.getLoggedInUser(session);

      expect(result).toEqual({
        ...user,
        webshop,
      });
    });
  });

  describe('generatedOtpAndSetOnUser', () => {
    it('should be defined', () => {
      expect(authService['generateOtpAndSetOnUser']).toBeDefined();
    });

    it('should generate a random password of length 6 and the expiresAt should be after now', async () => {
      const userId = faker.database.mongodbObjectId();
      usersService.addOtpById = jest.fn();
      encryptionService.saltAndHashString = jest
        .fn()
        .mockImplementation((password) => password);

      const { password, expiresAt } = await authService[
        'generateOtpAndSetOnUser'
      ](userId);

      expect(password.length).toBe(6);
      expect(expiresAt).toBeGreaterThan(Date.now());
      expect(usersService.addOtpById).toBeCalledTimes(1);
      expect(encryptionService.saltAndHashString).toBeCalledTimes(1);
    });

    it('should generate a random password of the specified', async () => {
      const userId = faker.database.mongodbObjectId();
      const passwordLength = 10;
      usersService.addOtpById = jest.fn();
      encryptionService.saltAndHashString = jest
        .fn()
        .mockImplementation((password) => password);

      const { password } = await authService['generateOtpAndSetOnUser'](
        userId,
        passwordLength,
      );

      expect(password.length).toBe(passwordLength);
    });

    it('should hash and set the password on the user', async () => {
      const userId = faker.database.mongodbObjectId();
      const hashedPassword = 'hashedPass';
      usersService.addOtpById = jest.fn();
      encryptionService.saltAndHashString = jest
        .fn()
        .mockResolvedValue(hashedPassword);

      const { expiresAt } = await authService['generateOtpAndSetOnUser'](
        userId,
      );

      expect(usersService.addOtpById).toBeCalledWith(userId, {
        expiresAt,
        password: hashedPassword,
      });
    });
  });
});
