import { GetSession, Session } from '@lib/common/session';
import { Body, Controller, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

import { SanitizedUserDto } from './dto/user.sanitized.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import { UsersService } from './users.service';

@Controller(UsersController.BasePath)
@ApiBearerAuth()
@ApiTags(UsersController.BasePath)
export class UsersController {
  static readonly BasePath = 'users';

  constructor(private readonly usersService: UsersService) {}

  @Patch()
  @ApiOperation({ summary: 'Updates the logged in users profile.' })
  @ZodSerializerDto(SanitizedUserDto)
  @ApiOkResponse({ type: SanitizedUserDto })
  updateLoggedInUser(
    @GetSession() session: Session,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateById(session.sub, updateUserDto);
  }
}
