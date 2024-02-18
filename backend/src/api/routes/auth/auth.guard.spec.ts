import { UserRole } from '@common/schemas';
import { sessionFactory, userDocFactory } from '@lib/test/factories';
import { TokensService } from '@lib/tokens/tokens.service';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { anything, instance, mock, verify, when } from 'ts-mockito';

import { UsersService } from '../users/users.service';
import {
  InsufficientPermissionsException,
  InvalidRefreshTokenException,
  MissingRefreshTokenException,
  UserNotAllowedException,
} from './auth.exceptions';
import { AuthGuard, IS_PUBLIC_KEY, NEEDED_ROLES_KEY } from './auth.guard';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  const mockTokenService = mock(TokensService);
  const mockUserService = mock(UsersService);
  const mockReflector = mock(Reflector);

  const mockExecutionContext = ({
    request,
    response,
  }: {
    request?: Request;
    response?: Response;
  }): Partial<
    Record<
      jest.FunctionPropertyNames<ExecutionContext>,
      jest.MockedFunction<any>
    >
  > => ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
      getResponse: jest.fn().mockReturnValue(response),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  });

  const mockDecorator = (key: string, value: unknown) => {
    when(mockReflector.getAllAndOverride(key, anything())).thenReturn(value);
  };

  beforeEach(async () => {
    authGuard = new AuthGuard(
      instance(mockTokenService),
      instance(mockUserService),
      instance(mockReflector),
    );
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('should return true when the "Public" decorator is used', async () => {
    mockDecorator(IS_PUBLIC_KEY, true);
    const canActivate = await authGuard.canActivate(
      mockExecutionContext({}) as any,
    );
    expect(canActivate).toBe(true);
  });

  it('should throw if no valid access and no refresh token is found', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    const mockRequest = mock<Request>();

    await expect(
      authGuard.canActivate(
        mockExecutionContext({ request: instance(mockRequest) }) as any,
      ),
    ).rejects.toThrow(MissingRefreshTokenException);
  });

  it('should throw if no valid access or refresh token is found', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    when(mockTokenService.getRefreshTokenFromCookie(request)).thenReturn(
      mockToken,
    );

    await expect(
      authGuard.canActivate(mockExecutionContext({ request }) as any),
    ).rejects.toThrow(InvalidRefreshTokenException);
  });

  it('should set a new access token when no valid one is found, but the refresh token is valid', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    const mockSession = sessionFactory.build();
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getRefreshTokenFromCookie(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseRefreshToken(mockToken)).thenResolve(
      mockSession,
    );

    try {
      await authGuard.canActivate(
        mockExecutionContext({ request, response }) as any,
      );
    } catch (error) {}

    verify(
      mockTokenService.setAccessTokenInHeader(response, mockSession.sub),
    ).once();
  });

  it('should set the found session on the request', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    const mockSession = sessionFactory.build();
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getAccessTokenFromHeader(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseAccessToken(mockToken)).thenResolve(mockSession);

    try {
      await authGuard.canActivate(
        mockExecutionContext({ request, response }) as any,
      );
    } catch (error) {}

    expect(request['session']).toMatchObject(mockSession);
  });

  it('should throw when the user is not verified', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    const mockUser = userDocFactory.build({ verified: false });
    const mockSession = sessionFactory.build({
      sub: mockUser._id,
      email: mockUser.email,
    });
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getAccessTokenFromHeader(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseAccessToken(mockToken)).thenResolve(mockSession);
    when(mockUserService.findById(mockSession.sub)).thenResolve(mockUser);

    await expect(
      authGuard.canActivate(mockExecutionContext({ request, response }) as any),
    ).rejects.toThrow(UserNotAllowedException);
  });

  it('should throw when the user is blocked', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    const mockUser = userDocFactory.build({ verified: true, blocked: true });
    const mockSession = sessionFactory.build({
      sub: mockUser._id,
      email: mockUser.email,
    });
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getAccessTokenFromHeader(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseAccessToken(mockToken)).thenResolve(mockSession);
    when(mockUserService.findById(mockSession.sub)).thenResolve(mockUser);

    await expect(
      authGuard.canActivate(mockExecutionContext({ request, response }) as any),
    ).rejects.toThrow(UserNotAllowedException);
  });

  it('should return true when no roles are required and a user is found', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    const mockUser = userDocFactory.build();
    const mockSession = sessionFactory.build({
      sub: mockUser._id,
      email: mockUser.email,
    });
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getAccessTokenFromHeader(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseAccessToken(mockToken)).thenResolve(mockSession);
    when(mockUserService.findById(mockSession.sub)).thenResolve(mockUser);

    const canActivate = await authGuard.canActivate(
      mockExecutionContext({ request, response }) as any,
    );

    expect(canActivate).toBe(true);
  });

  it('should return true when roles are required, but user is a god', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    mockDecorator(NEEDED_ROLES_KEY, [
      UserRole.COURIER,
      UserRole.RECIPIENT,
      UserRole.WEBSHOP,
    ]);
    const mockUser = userDocFactory.build({ roles: [UserRole.GOD] });
    const mockSession = sessionFactory.build({
      sub: mockUser._id,
      email: mockUser.email,
    });
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getAccessTokenFromHeader(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseAccessToken(mockToken)).thenResolve(mockSession);
    when(mockUserService.findById(mockSession.sub)).thenResolve(mockUser);

    const canActivate = await authGuard.canActivate(
      mockExecutionContext({ request, response }) as any,
    );

    expect(canActivate).toBe(true);
  });

  it('should throw when the user is missing one or more roles', async () => {
    mockDecorator(IS_PUBLIC_KEY, false);
    mockDecorator(NEEDED_ROLES_KEY, [
      UserRole.COURIER,
      UserRole.RECIPIENT,
      UserRole.WEBSHOP,
    ]);
    const mockUser = userDocFactory.build();
    const mockSession = sessionFactory.build({
      sub: mockUser._id,
      email: mockUser.email,
    });
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getAccessTokenFromHeader(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseAccessToken(mockToken)).thenResolve(mockSession);
    when(mockUserService.findById(mockSession.sub)).thenResolve(mockUser);

    await expect(
      authGuard.canActivate(mockExecutionContext({ request, response }) as any),
    ).rejects.toThrow(InsufficientPermissionsException);
  });

  it('should return true when the user has all required roles', async () => {
    const neededRoles = [
      UserRole.COURIER,
      UserRole.RECIPIENT,
      UserRole.WEBSHOP,
    ];
    mockDecorator(IS_PUBLIC_KEY, false);
    mockDecorator(NEEDED_ROLES_KEY, neededRoles);
    const mockUser = userDocFactory.build({ roles: neededRoles });
    const mockSession = sessionFactory.build({
      sub: mockUser._id,
      email: mockUser.email,
    });
    const mockToken = 'token';
    const mockRequest = mock<Request>();
    const request = instance(mockRequest);
    const mockResponse = mock<Response>();
    const response = instance(mockResponse);
    when(mockTokenService.getAccessTokenFromHeader(request)).thenReturn(
      mockToken,
    );
    when(mockTokenService.parseAccessToken(mockToken)).thenResolve(mockSession);
    when(mockUserService.findById(mockSession.sub)).thenResolve(mockUser);

    const canActivate = await authGuard.canActivate(
      mockExecutionContext({ request, response }) as any,
    );

    expect(canActivate).toBe(true);
  });
});
