import { UserRole } from '@common/schemas';
import { TokensService } from '@lib/tokens/tokens.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UsersService } from '../users/users.service';
import {
  InsufficientPermissionsException,
  InvalidRefreshTokenException,
  MissingRefreshTokenException,
  UserNotAllowedException,
} from './auth.exceptions';

// Custom decorators for access control on routes
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const NEEDED_ROLES_KEY = 'needed_roles';
export const NeededRoles = (...roles: UserRole[]) =>
  SetMetadata(NEEDED_ROLES_KEY, roles);

export const ALLOWED_ROLES_KEY = 'allowed_roles';
export const AllowedRoles = (...roles: UserRole[]) =>
  SetMetadata(ALLOWED_ROLES_KEY, roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokensService: TokensService,
    private userService: UsersService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // look for the access token
    const accessToken = this.tokensService.getAccessTokenFromHeader(request);
    // get the session from the token
    let session = await this.tokensService.parseAccessToken(accessToken || '');

    if (!session) {
      // no session was found in the access token, we try the refresh token instead.
      const refreshToken =
        this.tokensService.getRefreshTokenFromCookie(request);
      if (!refreshToken) throw new MissingRefreshTokenException();

      session = await this.tokensService.parseRefreshToken(refreshToken);
      if (!session) throw new InvalidRefreshTokenException();
      // set the new access token in the response headers
      await this.tokensService.setAccessTokenInHeader(
        context.switchToHttp().getResponse(),
        session.sub,
      );
    }

    // set the session on the request for use in later middlewares using the @Session decorator
    request['session'] = session;

    // check if the user in the session has the correct access rights
    const user = await this.userService.findById(session.sub);
    if (!user.verified || user.blocked) throw new UserNotAllowedException();

    // GOD users can do anything
    if (user.roles.includes(UserRole.GOD)) return true;

    const neededRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(NEEDED_ROLES_KEY, [context.getHandler(), context.getClass()]);
    const allowedRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(ALLOWED_ROLES_KEY, [context.getHandler(), context.getClass()]);

    const noNeededRoles = !neededRoles || neededRoles.length == 0;
    const noAllowedRoles = !allowedRoles || allowedRoles.length == 0;

    // No specific roles needed, any user can access this
    if (noNeededRoles && noAllowedRoles) return true;

    const userHasAllNeededRoles =
      noNeededRoles || neededRoles.every((role) => user.roles.includes(role));
    const userHasSomeAllowedRoles =
      noAllowedRoles || allowedRoles.some((role) => user.roles.includes(role));

    if (!userHasAllNeededRoles || !userHasSomeAllowedRoles)
      throw new InsufficientPermissionsException();

    return true;
  }
}
