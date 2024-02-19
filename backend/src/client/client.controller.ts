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
    const file = createReadStream(
      join(__dirname, '..', '..', '..', 'frontend', 'dist', 'index.html'),
    );
    file.pipe(response);
  }
}
