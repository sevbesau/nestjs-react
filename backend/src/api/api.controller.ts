import { TConfig } from '@lib/config/config';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';

import { Public } from './routes/auth/auth.guard';

@Controller()
export class ApiController {
  constructor(private readonly configService: ConfigService<TConfig>) {}

  @Get()
  @ApiOperation({ summary: 'Get api name.' })
  @Public()
  getHello(): string {
    return this.configService.getOrThrow('API_NAME');
  }
}
