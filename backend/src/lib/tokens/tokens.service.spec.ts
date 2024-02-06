import { createMockConfigService } from '@lib/test/config';
import { sessionFactory, userDocFactory } from '@lib/test/factories';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';
import { instance, mock, objectContaining, verify, when } from 'ts-mockito';

import { UserNotFoundException } from '@/api/users/user.exceptions';
import { UsersService } from '@/api/users/users.service';

import { TokensService } from './tokens.service';

describe('TokensService', () => {
  let tokensService: TokensService;

  const accessTokenSecret = 'accessTokenSecret';
  const refreshTokenSecret = 'refreshTokenSecret';
  const tokenExpiration = '1d';
  const mockConfigService = createMockConfigService({
    JWT_ACCESS_TOKEN_SECRET: accessTokenSecret,
    JWT_ACCESS_TOKEN_EXPIRATION: tokenExpiration,
    JWT_REFRESH_TOKEN_SECRET: refreshTokenSecret,
    JWT_REFRESH_TOKEN_EXPIRATION: tokenExpiration,
  });

  const mockJwtService = mock(JwtService);
  const mockUserSerice = mock(UsersService);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TokensService],
    })
      .useMocker((token) => {
        if (token === ConfigService) return instance(mockConfigService);
        if (token === JwtService) return instance(mockJwtService);
        if (token === UsersService) return instance(mockUserSerice);
      })
      .compile();

    tokensService = module.get<TokensService>(TokensService);
  });

  it('should be defined', () => {
    expect(tokensService).toBeDefined();
  });

  describe('setAccessTokenInHeader', () => {
    it('should be defined', () => {
      expect(tokensService.setAccessTokenInHeader).toBeDefined();
    });

    it('should set an access token in the headers', async () => {
      const session = sessionFactory.build();
      const mockResponse = mock<Response>();
      const response = instance(mockResponse);
      const token = 'accessToken';
      const createJwtSpy = jest
        .spyOn(tokensService as any, 'createJwt')
        .mockResolvedValueOnce(token);

      await tokensService.setAccessTokenInHeader(response, session.sub);

      expect(createJwtSpy).toHaveBeenCalledWith(
        session.sub,
        accessTokenSecret,
        tokenExpiration,
      );
      verify(
        mockResponse.set(
          objectContaining({
            [tokensService['tokenField']]: `Bearer ${token}`,
          }),
        ),
      ).once();

      jest.spyOn(tokensService as any, 'createJwt').mockRestore();
    });
  });

  describe('setRefreshTokenInCookie', () => {
    it('should be defined', () => {
      expect(tokensService.setRefreshTokenInCookie).toBeDefined();
    });

    it('should set a token in the cookies', async () => {
      const session = sessionFactory.build();
      const mockResponse = mock<Response>();
      const response = instance(mockResponse);
      const token = 'accessToken';
      const createJwtSpy = jest
        .spyOn(tokensService as any, 'createJwt')
        .mockResolvedValueOnce(token);

      await tokensService.setRefreshTokenInCookie(response, session.sub);

      expect(createJwtSpy).toHaveBeenCalledWith(
        session.sub,
        refreshTokenSecret,
        tokenExpiration,
      );
      verify(
        mockResponse.cookie(
          tokensService['tokenField'],
          `Bearer ${token}`,
          objectContaining({
            sameSite: 'strict',
            httpOnly: true,
          }),
        ),
      ).once();

      jest.spyOn(tokensService as any, 'createJwt').mockRestore();
    });
  });

  describe('createJwt', () => {
    it('should be defined', () => {
      expect(tokensService['createJwt']).toBeDefined();
    });

    it('should generate a jwt with the correct parameters', async () => {
      const secret = accessTokenSecret;
      const expiresIn = tokenExpiration;
      const token = 'token';
      const user = userDocFactory.build();
      const session = sessionFactory.build({
        sub: user._id,
        version: user.tokenVersion,
        email: user.email,
      });
      when(mockUserSerice.findById(user._id)).thenResolve(user);
      when(
        mockJwtService.signAsync(
          objectContaining(session),
          objectContaining({
            secret,
            expiresIn,
          }),
        ),
      ).thenResolve(token);

      const generatedToken = await tokensService['createJwt'](
        user._id,
        accessTokenSecret,
        tokenExpiration,
      );

      verify(
        mockJwtService.signAsync(
          objectContaining(session),
          objectContaining({
            secret,
            expiresIn,
          }),
        ),
      ).once();
      expect(generatedToken).toBe(token);
    });
  });

  describe('parseRefreshToken', () => {
    it('should be defined', () => {
      expect(tokensService.parseRefreshToken).toBeDefined();
    });

    it('should return the parsed payload using the parseJwt function', async () => {
      const mockToken = 'token';
      const mockSession = sessionFactory.build();
      const parseJwtSpy = jest
        .spyOn(tokensService as any, 'parseJwt')
        .mockResolvedValue(mockSession);

      const session = await tokensService.parseRefreshToken(mockToken);

      expect(parseJwtSpy).toBeCalledWith(mockToken, refreshTokenSecret);
      expect(session).toMatchObject(mockSession);

      jest.spyOn(tokensService as any, 'parseJwt').mockRestore();
    });
  });

  describe('parseAccessToken', () => {
    it('should be defined', () => {
      expect(tokensService.parseAccessToken).toBeDefined();
    });

    it('should return the parsed payload using the parseJwt function', async () => {
      const mockToken = 'token';
      const mockSession = sessionFactory.build();
      const parseJwtSpy = jest
        .spyOn(tokensService as any, 'parseJwt')
        .mockResolvedValue(mockSession);

      const session = await tokensService.parseAccessToken(mockToken);

      expect(parseJwtSpy).toBeCalledWith(mockToken, accessTokenSecret);
      expect(session).toMatchObject(mockSession);

      jest.spyOn(tokensService as any, 'parseJwt').mockRestore();
    });
  });

  describe('parseJwt', () => {
    it('should be defined', () => {
      expect(tokensService['parseJwt']).toBeDefined();
    });

    it('should return the payload for a valid jwt', async () => {
      const mockToken = 'token';
      const secret = accessTokenSecret;
      const user = userDocFactory.build();
      const mockSession = sessionFactory.build({
        sub: user._id,
        email: user.email,
        version: user.tokenVersion,
      });
      when(
        mockJwtService.verifyAsync(mockToken, objectContaining({ secret })),
      ).thenResolve(mockSession);
      when(mockUserSerice.findById(user._id)).thenResolve(user);

      const session = await tokensService['parseJwt'](mockToken, secret);

      expect(session).toMatchObject(mockSession);
      verify(
        mockJwtService.verifyAsync(mockToken, objectContaining({ secret })),
      ).once();
      verify(mockUserSerice.findById(user._id)).once();
    });

    it('should return null when the token was could not be parsed', async () => {
      const mockToken = 'token';
      const secret = accessTokenSecret;
      when(
        mockJwtService.verifyAsync(mockToken, objectContaining({ secret })),
      ).thenResolve(null);

      const session = await tokensService['parseJwt'](mockToken, secret);

      expect(session).toBeNull();
    });

    it('should return null when the user in the payload does not exist', async () => {
      const mockToken = 'token';
      const secret = accessTokenSecret;
      const mockSession = sessionFactory.build();
      when(
        mockJwtService.verifyAsync(mockToken, objectContaining({ secret })),
      ).thenResolve(mockSession);
      when(mockUserSerice.findById(mockSession.sub)).thenThrow(
        new UserNotFoundException(),
      );

      const session = await tokensService['parseJwt'](mockToken, secret);

      expect(session).toBeNull();
    });

    it('should return null when the tokenVersion is outdated', async () => {
      const mockToken = 'token';
      const secret = accessTokenSecret;
      const user = userDocFactory.build({ tokenVersion: 1 });
      const mockSession = sessionFactory.build({
        sub: user._id,
        email: user.email,
        version: user.tokenVersion - 1,
      });
      when(
        mockJwtService.verifyAsync(mockToken, objectContaining({ secret })),
      ).thenResolve(mockSession);
      when(mockUserSerice.findById(user._id)).thenResolve(user);

      const session = await tokensService['parseJwt'](mockToken, secret);

      expect(session).toBeNull();
    });
  });

  describe('getAccessTokenFromHeader', () => {
    it('should be defined', () => {
      expect(tokensService.getAccessTokenFromHeader).toBeDefined();
    });

    it('should call parseBearerToken with the tokenString from the headers', () => {
      const parseBearerTokenSpy = jest.spyOn(
        tokensService as any,
        'parseBearerToken',
      );
      const mockToken = 'token';
      const mockTokenField = `Bearer ${mockToken}`;
      const token = tokensService.getAccessTokenFromHeader({
        headers: {
          [tokensService['tokenField']]: mockTokenField,
        },
      } as Request);
      expect(token).toBe(mockToken);
      expect(parseBearerTokenSpy).toBeCalledWith(mockTokenField);

      jest.spyOn(tokensService as any, 'parseBearerToken').mockRestore();
    });
  });

  describe('getRefreshTokenFromCookie', () => {
    it('should be defined', () => {
      expect(tokensService.getRefreshTokenFromCookie).toBeDefined();
    });

    it('should call parseBearerToken with the tokenString from the cookie', () => {
      const parseBearerTokenSpy = jest.spyOn(
        tokensService as any,
        'parseBearerToken',
      );
      const mockToken = 'token';
      const mockTokenField = `Bearer ${mockToken}`;
      const token = tokensService.getRefreshTokenFromCookie({
        cookies: {
          [tokensService['tokenField']]: mockTokenField,
        },
      } as Request);
      expect(token).toBe(mockToken);
      expect(parseBearerTokenSpy).toBeCalledWith(mockTokenField);

      jest.spyOn(tokensService as any, 'parseBearerToken').mockRestore();
    });
  });

  describe('parseBearerToken', () => {
    it('should be defined', () => {
      expect(tokensService['parseBearerToken']).toBeDefined();
    });

    it('should return the token', () => {
      const mockToken = 'token';
      const token = tokensService['parseBearerToken'](`Bearer ${mockToken}`);
      expect(token).toBe(mockToken);
    });

    it('should return undefined when undefined is passed', () => {
      const token = tokensService['parseBearerToken'](undefined);
      expect(token).toBeUndefined();
    });

    it('should return undefined when the tokenField is incorrectly formatted', () => {
      const token = tokensService['parseBearerToken']('token');
      expect(token).toBeUndefined();
    });

    it('should return undefined when the tokenField has the wrong type ', () => {
      const token = tokensService['parseBearerToken']('Token token');
      expect(token).toBeUndefined();
    });
  });

  describe('clearRefreshToken', () => {
    it('should be defined', () => {
      expect(tokensService.clearRefreshToken).toBeDefined();
    });

    it('should call the clearCookie function on the response', () => {
      const mockResponse = mock<Response>();
      tokensService.clearRefreshToken(instance(mockResponse));
      verify(mockResponse.clearCookie(tokensService['tokenField'])).once();
    });
  });
});
