import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

export class TokenNotFoundException extends UnauthorizedException {
  constructor() {
    super('Authorization token was not set');
  }
}

export class IncorrectPasswordException extends BadRequestException {
  constructor() {
    super('Incorrect password');
  }
}

export class ExpiredOtpException extends BadRequestException {
  constructor() {
    super('Expired otp');
  }
}

export class MissingRefreshTokenException extends BadRequestException {
  constructor() {
    super('No refresh token set in cookies');
  }
}

export class InvalidRefreshTokenException extends BadRequestException {
  constructor() {
    super('The refresh token found is invalid');
  }
}

export class DuplicateEmailException extends ConflictException {
  constructor() {
    super('A user with that email exists');
  }
}

export class UserNotAllowedException extends UnauthorizedException {
  constructor() {
    super('User not allowed');
  }
}

export class InsufficientPermissionsException extends UnauthorizedException {
  constructor() {
    super('User has insufficient permissions');
  }
}
