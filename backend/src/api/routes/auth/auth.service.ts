import { TOtp } from '@common/schemas';
import { CaptchaService } from '@lib/captcha/captcha.service';
import { Session } from '@lib/common/session';
import { EmailService } from '@lib/email/email.service';
import otpTemplate from '@lib/email/templates/otp';
import { EncryptionService } from '@lib/encryption/encryption.service';
import { TokensService } from '@lib/tokens/tokens.service';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

import { UsersService } from '../users/users.service';
import { SignInStrategy } from './auth.controller';
import {
  DuplicateEmailException,
  ExpiredOtpException,
  IncorrectPasswordException,
  InvalidRefreshTokenException,
  MissingRefreshTokenException,
} from './auth.exceptions';
import { ValidateOtpRequestDto } from './dto/otp.dto';
import { SignedInUserResponseDto } from './dto/signedInUser.dto';
import { SignInRequestDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly captchaService: CaptchaService,
    private readonly encryptionService: EncryptionService,
    private readonly tokensService: TokensService,
  ) {}

  async signIn(strategy: SignInStrategy, { email }: SignInRequestDto) {
    const user = await this.usersService.findByEmail(email);

    switch (strategy) {
      case SignInStrategy.OTP:
        const otp = await this.generateOtpAndSetOnUser(user._id);
        await this.emailService.sendTemplateMail(
          otpTemplate,
          { otp: otp.password },
          user.email,
        );
        return { userId: user._id };
      case SignInStrategy.PASSWORD:
        // check if body has password
        // check if user has password
        // check if password matches
        // return session
        break;
    }
  }

  async validateOtp(
    response: Response,
    { password, userId }: ValidateOtpRequestDto,
  ) {
    const user = await this.usersService.findById(userId);

    // Compare all otps of the user in parallel
    const otpCompareResults = await Promise.all(
      user.otps.map((otp) =>
        this.encryptionService.compareSaltedAndHashedString(
          password,
          otp.password,
        ),
      ),
    );
    const matchingOtpIndex = otpCompareResults.indexOf(true);
    if (matchingOtpIndex < 0) throw new IncorrectPasswordException();
    if (user.otps[matchingOtpIndex].expiresAt < Date.now())
      throw new ExpiredOtpException();

    await this.usersService.clearOtpsById(user._id);

    // if the user filled in a correct otp, we know his email address is verified.
    if (!user.verified) await this.usersService.verifyById(user._id);

    await Promise.all([
      this.tokensService.setAccessTokenInHeader(response, user._id),
      this.tokensService.setRefreshTokenInCookie(response, user._id),
    ]);
    return;
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = this.tokensService.getRefreshTokenFromCookie(request);
    if (!refreshToken) throw new MissingRefreshTokenException();
    const session = await this.tokensService.parseRefreshToken(refreshToken);
    if (!session) throw new InvalidRefreshTokenException();
    return this.tokensService.setAccessTokenInHeader(response, session.sub);
  }

  async signOut(session: Session, response: Response) {
    await this.usersService.incrementTokenVersionById(session.sub);
    return this.tokensService.clearRefreshToken(response);
  }

  async signUp(userSignUpDto: SignUpDto) {
    const { email } = userSignUpDto;
    const isDuplicateEmail = await this.usersService.isDuplicateEmail(email);
    if (isDuplicateEmail) throw new DuplicateEmailException();

    await this.captchaService.validateResponse(userSignUpDto.captchaResponse);

    const user = await this.usersService.createOne(userSignUpDto);
    const otp = await this.generateOtpAndSetOnUser(user._id);

    await this.emailService.sendTemplateMail(
      otpTemplate,
      { otp: otp.password },
      user.email,
    );

    return { userId: user._id };
  }

  async getLoggedInUser({ sub }: Session): Promise<SignedInUserResponseDto> {
    return this.usersService.findById(sub);
  }

  private async generateOtpAndSetOnUser(
    userId: string,
    length = 6,
  ): Promise<TOtp> {
    const password = Array.from({ length }, () =>
      Math.floor(Math.random() * 10),
    ).join('');
    const expiresAt = Date.now() + 60 * 60 * 1000; // TODO: put in config
    await this.usersService.addOtpById(userId, {
      expiresAt,
      password: await this.encryptionService.saltAndHashString(password),
    });
    return {
      password,
      expiresAt,
    };
  }
}
