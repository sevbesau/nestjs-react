import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

import { Public } from '@/api/routes/auth/auth.guard';

@Controller()
export class ClientController {
  @Get('*')
  @Public()
  getClient(
    @Res()
    response: Response,
  ) {
    console.log('serve file');

    const file = createReadStream(
      join(__dirname, '..', '..', '..', 'frontend', 'dist', 'index.html'),
    );
    file.pipe(response);
  }

  // @Get('')
  // @ApiOperation({ summary: 'Get api name.' })
  // @Public()
  // getHello(): string {
  //   return this.appService.getApiName();
  // }
}
