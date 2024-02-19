import { Session, sessionZodSchema } from '@lib/common/session';
import { TConfig } from '@lib/config/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

import { UsersService } from '@/api/routes/users/users.service';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<TConfig>,
  ) {}

  private tokenField = 'authorization';

  async setAccessTokenInHeader(response: Response, sub: string) {
    const token = await this.createJwt(
      sub,
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION'),
    );
    response.set({ [this.tokenField]: `Bearer ${token}` });
  }

  async setRefreshTokenInCookie(response: Response, sub: string) {
    const token = await this.createJwt(
      sub,
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION'),
    );
    response.cookie(this.tokenField, `Bearer ${token}`, {
      sameSite: 'strict',
      httpOnly: true,
    });
  }

  private async createJwt(sub: string, secret: string, expiresIn: string) {
    const user = await this.usersService.findById(sub);
    const payload: Session = {
      sub: user._id,
      email: user.email,
      version: user.tokenVersion,
    };
    return this.jwtService.signAsync(payload, {
      expiresIn,
      secret,
    });
  }

  async parseRefreshToken(refreshToken: string): Promise<Session | null> {
    return this.parseJwt(
      refreshToken,
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
    );
  }

  async parseAccessToken(accessToken: string): Promise<Session | null> {
    return this.parseJwt(
      accessToken,
      this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
    );
  }

  private async parseJwt(
    token: string,
    secret: string,
  ): Promise<Session | null> {
    try {
      const session = await this.jwtService.verifyAsync(token, {
        secret,
      });
      const parsedSession = sessionZodSchema.parse(session);

      const user = await this.usersService.findById(parsedSession.sub);
      if (user.tokenVersion != session.version)
        throw new UnauthorizedException('invalid token');
      return parsedSession;
    } catch (error) {
      return null;
    }
  }

  getAccessTokenFromHeader(request: Request): string | undefined {
    const headerValue = (request.headers[this.tokenField] as string) || '';
    return this.parseBearerToken(headerValue);
  }

  getRefreshTokenFromCookie(request: Request): string | undefined {
    const cookieValue = (request.cookies[this.tokenField] as string) || '';
    return this.parseBearerToken(cookieValue);
  }

  private parseBearerToken(tokenString): string | undefined {
    if (!tokenString) return;
    const [type, token] = tokenString.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  clearRefreshToken(response: Response) {
    response.clearCookie(this.tokenField);
  }
}
