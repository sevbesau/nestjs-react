/* eslint-disable @typescript-eslint/ban-ts-comment */
import { UserRole } from '@common/schemas';
import { InvalidCaptchaException } from '@lib/captcha/captcha.exceptions';
import { CaptchaService } from '@lib/captcha/captcha.service';
import { EmailService } from '@lib/email/email.service';
import otpTemplate from '@lib/email/templates/otp';
import { EncryptionService } from '@lib/encryption/encryption.service';
import {
  sessionFactory,
  userDocFactory,
  userFactory,
} from '@lib/test/factories';
import { webshopDocFactory } from '@lib/test/factories/webshop.factory';
import { TokensService } from '@lib/tokens/tokens.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import {
  anyString,
  anything,
  instance,
  mock,
  objectContaining,
  resetCalls,
  verify,
  when,
} from 'ts-mockito';

import { User } from '../users/users.schema';
import { UsersService } from '../users/users.service';
import { Webshop } from '../webshops/webshops.schema';
import { WebshopsService } from '../webshops/webshops.service';
import {
  DuplicateEmailException,
  ExpiredOtpException,
  IncorrectPasswordException,
  InvalidRefreshTokenException,
  MissingRefreshTokenException,
} from './auth.exceptions';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';

describe('AuthService', () => {
  let authService: AuthService;
  const mockUserService = mock(UsersService);
  const mockWebshopService = mock(WebshopsService);
  const mockEmailService = mock(EmailService);
  const mockCaptchaService = mock(CaptchaService);
  const mockEncryptionService = mock(EncryptionService);
  const mockTokenService = mock(TokensService);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === UsersService) return instance(mockUserService);
        if (token === WebshopsService) return instance(mockWebshopService);
        if (token === EmailService) return instance(mockEmailService);
        if (token === CaptchaService) return instance(mockCaptchaService);
        if (token === EncryptionService) return instance(mockEncryptionService);
        if (token === TokensService) return instance(mockTokenService);
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

    it('should return the userId when a user is found', async () => {
      const user = userDocFactory.build();
      when(mockUserService.findByEmail(user.email)).thenResolve(user);

      const { userId } = await authService.signIn({ email: user.email });
      expect(userId).toBeDefined();
      expect(userId).toEqual(user._id);
    });

    it('should generate an otp and send an otp email when a user is found', async () => {
      resetCalls(mockEmailService);
      const user = userDocFactory.build();
      when(mockUserService.findByEmail(user.email)).thenResolve(user);
      const generateOtpSpy = jest.spyOn(
        authService as any,
        'generateOtpAndSetOnUser',
      );
      // mock Math.random to get same otp every time
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
      await authService.signIn({ email: user.email });
      verify(
        mockEmailService.sendTemplateMail(
          otpTemplate,
          objectContaining({ otp: '555555' }),
          user.email,
        ),
      ).once();
      expect(generateOtpSpy).toBeCalledWith(user._id);
      jest.spyOn(global.Math, 'random').mockRestore();
      jest.spyOn(authService as any, 'generateOtpAndSetOnUser').mockRestore();
    });
  });

  describe('validateOtp', () => {
    it('should be defined', () => {
      expect(authService.validateOtp).toBeDefined();
    });

    it('should set a token in the headers and the cookies and clear the otps when a correct password is given', async () => {
      const correctPassword = '123456';
      const user = userDocFactory.build({
        otps: [
          { password: correctPassword, expiresAt: Date.now() + 10_000 },
          { password: 'askljfa', expiresAt: Date.now() + 10_000 },
          { password: 'sdasdas', expiresAt: Date.now() + 10_000 },
          { password: 'asdwqas', expiresAt: Date.now() + 10_000 },
          { password: 'desdees', expiresAt: Date.now() + 10_000 },
        ],
      });
      when(mockUserService.findById(user._id)).thenResolve(user);
      when(
        mockEncryptionService.compareSaltedAndHashedString(
          anyString(),
          correctPassword,
        ),
      ).thenResolve(true);

      const mockResponse = mock<Response>();
      const response = instance(mockResponse);

      await authService.validateOtp(response, {
        password: correctPassword,
        userId: user._id,
      });

      verify(mockUserService.clearOtpsById(user._id)).once();
      verify(
        mockTokenService.setAccessTokenInHeader(response, user._id),
      ).once();
      verify(
        mockTokenService.setRefreshTokenInCookie(response, user._id),
      ).once();
    });

    it('should throw when the password is incorrect', async () => {
      const user = userDocFactory.build({
        otps: [
          { password: 'askljfa', expiresAt: Date.now() + 10_000 },
          { password: 'ooiiohl', expiresAt: Date.now() + 10_000 },
          { password: 'aksksks', expiresAt: Date.now() + 10_000 },
        ],
      });
      when(mockUserService.findById(user._id)).thenResolve(user);
      when(
        mockEncryptionService.compareSaltedAndHashedString(
          anyString(),
          anyString(),
        ),
      ).thenResolve(false);

      const mockResponse = mock<Response>();

      await expect(
        authService.validateOtp(instance(mockResponse), {
          password: 'random',
          userId: user._id,
        }),
      ).rejects.toThrow(IncorrectPasswordException);
    });

    it('should throw when the otp is expired', async () => {
      const correctPassword = 'password';
      const user = userDocFactory.build({
        otps: [{ password: correctPassword, expiresAt: Date.now() - 10_000 }],
      });
      when(mockUserService.findById(user._id)).thenResolve(user);
      when(
        mockEncryptionService.compareSaltedAndHashedString(
          anyString(),
          correctPassword,
        ),
      ).thenResolve(true);

      const mockResponse = mock<Response>();

      await expect(
        authService.validateOtp(instance(mockResponse), {
          password: 'random',
          userId: user._id,
        }),
      ).rejects.toThrow(ExpiredOtpException);
    });
  });

  describe('refresh', () => {
    it('should be defined', () => {
      expect(authService.refresh).toBeDefined();
    });

    it('should generate and send a new token for valid refresh tokens', async () => {
      const refreshToken = 'refreshToken';
      const session = sessionFactory.build();
      when(mockTokenService.getRefreshTokenFromCookie(anything())).thenReturn(
        refreshToken,
      );
      when(mockTokenService.parseRefreshToken(refreshToken)).thenResolve(
        session,
      );

      const mockRequest = mock<Request>();
      const mockResponse = mock<Response>();
      const response = instance(mockResponse);

      await authService.refresh(instance(mockRequest), response);

      verify(
        mockTokenService.setAccessTokenInHeader(response, session.sub),
      ).once();
    });

    it('should throw when no refresh token is set', async () => {
      const refreshToken = undefined;
      when(mockTokenService.getRefreshTokenFromCookie(anything())).thenReturn(
        refreshToken,
      );

      const mockRequest = mock<Request>();
      const mockResponse = mock<Response>();

      await expect(
        authService.refresh(instance(mockRequest), instance(mockResponse)),
      ).rejects.toThrow(MissingRefreshTokenException);
    });

    it('should throw when the refresh token is invalid', async () => {
      const refreshToken = 'invaid';
      when(mockTokenService.getRefreshTokenFromCookie(anything())).thenReturn(
        refreshToken,
      );
      when(mockTokenService.parseRefreshToken(refreshToken)).thenResolve(null);

      const mockRequest = mock<Request>();
      const mockResponse = mock<Response>();

      await expect(
        authService.refresh(instance(mockRequest), instance(mockResponse)),
      ).rejects.toThrow(InvalidRefreshTokenException);
    });
  });

  describe('signOut', () => {
    it('should be defined', () => {
      expect(authService.signOut).toBeDefined();
    });

    it('should increment the token version and clear the refresh token cookie', async () => {
      const mockResponse = mock<Response>();
      const response = instance(mockResponse);
      const session = sessionFactory.build();
      await authService.signOut(session, response);
      verify(mockUserService.incrementTokenVersionById(session.sub)).once();
      verify(mockTokenService.clearRefreshToken(response)).once();
    });
  });

  describe('signUp', () => {
    it('should be defined', () => {
      expect(authService.signUp).toBeDefined();
    });

    it('should create the user, generate an otp, send the otp mail and return the userId on success', async () => {
      const captchaResponse = 'response';
      const signUpDto: SignUpDto = {
        ...userFactory.build(),
        captchaResponse,
        roles: [UserRole.COURIER],
      };
      when(mockUserService.isDuplicateEmail(signUpDto.email)).thenResolve(
        false,
      );
      when(
        mockCaptchaService.validateResponse(signUpDto.captchaResponse),
      ).thenResolve();
      when(mockUserService.createOne(signUpDto)).thenResolve(
        userDocFactory.build({ email: signUpDto.email }),
      );
      const generateOtpSpy = jest.spyOn(
        authService as any,
        'generateOtpAndSetOnUser',
      );
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5);

      const response = await authService.signUp(signUpDto);

      verify(mockUserService.createOne(signUpDto)).once();
      expect(generateOtpSpy).toBeCalled();
      verify(
        mockEmailService.sendTemplateMail(
          otpTemplate,
          objectContaining({ otp: '555555' }),
          signUpDto.email,
        ),
      ).once();
      expect(response.userId).toBeDefined();

      jest.spyOn(global.Math, 'random').mockRestore();
      jest.spyOn(authService as any, 'generateOtpAndSetOnUser').mockRestore();
    });

    it('should throw for duplicate emails', async () => {
      const signUpDto: SignUpDto = {
        ...userFactory.build(),
        captchaResponse: '',
        roles: [UserRole.COURIER],
      };
      when(mockUserService.isDuplicateEmail(signUpDto.email)).thenResolve(true);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        DuplicateEmailException,
      );
    });

    it('should throw for an invalid captcha', async () => {
      const captchaResponse = 'invalid';
      const signUpDto: SignUpDto = {
        ...userFactory.build(),
        captchaResponse,
        roles: [UserRole.COURIER],
      };
      when(mockUserService.isDuplicateEmail(signUpDto.email)).thenResolve(
        false,
      );
      when(mockCaptchaService.validateResponse(captchaResponse)).thenThrow(
        new InvalidCaptchaException(),
      );

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        InvalidCaptchaException,
      );
    });
  });

  describe('getLoggedInUser', () => {
    it('should be defined', () => {
      expect(authService.getLoggedInUser).toBeDefined();
    });

    it('should return the logged in user', async () => {
      const user = userDocFactory.build();
      const session = sessionFactory.build({ sub: user._id });
      when(mockUserService.findById(session.sub)).thenResolve(user);
      const response = await authService.getLoggedInUser(session);
      expect(response).toMatchObject(user);
    });

    it('should also include the webshop if the user has a webshop', async () => {
      const user = userDocFactory.build();
      const webshop = webshopDocFactory.build({ user });
      const session = sessionFactory.build({ sub: user._id });
      when(mockUserService.findById(session.sub)).thenResolve(user);
      when(mockWebshopService.findByUserId(user._id)).thenResolve(webshop);

      const response = await authService.getLoggedInUser(session);

      expect(response).toMatchObject<User & { webshop: Webshop }>({
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
      const user = userDocFactory.build();
      const { password, expiresAt } = await authService[
        'generateOtpAndSetOnUser'
      ](user._id);

      expect(password.length).toBe(6);
      expect(expiresAt).toBeGreaterThan(Date.now());
    });

    it('should generate a random password of the specified', async () => {
      const passwordLength = 10;
      const user = userDocFactory.build();

      const { password } = await authService['generateOtpAndSetOnUser'](
        user._id,
        passwordLength,
      );

      expect(password.length).toBe(passwordLength);
    });

    it('should hash and set the password on the user', async () => {
      const user = userDocFactory.build();
      const hashedPassword = 'hashedPass';
      resetCalls(mockEncryptionService);
      when(mockEncryptionService.saltAndHashString(anyString())).thenResolve(
        hashedPassword,
      );

      const { password, expiresAt } = await authService[
        'generateOtpAndSetOnUser'
      ](user._id);

      verify(mockEncryptionService.saltAndHashString(password)).once();
      verify(
        mockUserService.addOtpById(
          user._id,
          objectContaining({
            expiresAt,
            password: hashedPassword,
          }),
        ),
      ).once();
    });
  });
});
