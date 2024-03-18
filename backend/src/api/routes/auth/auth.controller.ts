import {
  clearCookieHeader,
  mergeHeaders,
  setAuthorizationHeader,
  setCookieHeader,
} from '@lib/common/openapi';
import { GetSession, Session } from '@lib/common/session';
import { Body, Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ZodSerializerDto } from 'nestjs-zod';

import { Public } from './auth.guard';
import { AuthService } from './auth.service';
import { ValidateOtpRequestDto } from './dto/otp.dto';
import { SignedInUserResponseDto } from './dto/signedInUser.dto';
import { SignInRequestDto, SignInResponseDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  @ApiOperation({
    summary: 'Lets the user sign in using one of the various methods',
  })
  @Public()
  @ZodSerializerDto(SignInResponseDto)
  @ApiOkResponse({ type: SignInResponseDto })
  signIn(@Body() signInDto: SignInRequestDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Creates a user account.' })
  @Public()
  @ZodSerializerDto(SignInResponseDto)
  @ApiOkResponse({ type: SignInResponseDto })
  userSignUp(@Body() userSignUpDto: SignUpDto) {
    return this.authService.signUp(userSignUpDto);
  }

  @Post('otp')
  @ApiOperation({
    summary: 'Validates the otp and returns an access and refresh token.',
  })
  @Public()
  @ApiOkResponse(mergeHeaders(setCookieHeader, setAuthorizationHeader))
  validateOtp(
    @Res({ passthrough: true }) response: Response,
    @Body() otpDto: ValidateOtpRequestDto,
  ) {
    return this.authService.validateOtp(response, otpDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Returns a new access token.',
  })
  @ApiCookieAuth()
  @ApiOkResponse(setAuthorizationHeader)
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request, response);
  }

  @Delete('signout')
  @ApiOperation({
    summary:
      'Invalidates the current session and clears the refresh token cookie.',
  })
  @ApiOkResponse(clearCookieHeader)
  @ApiCookieAuth()
  signOut(
    @GetSession() session: Session,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.signOut(session, response);
  }

  @Get('')
  @ApiOperation({
    summary: 'Get the authenticated user.',
  })
  @ApiBearerAuth()
  @ZodSerializerDto(SignedInUserResponseDto)
  @ApiOkResponse({ type: SignedInUserResponseDto })
  getLoggedInUser(@GetSession() session: Session) {
    return this.authService.getLoggedInUser(session);
  }
}
