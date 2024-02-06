import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '@/api/users/users.module';

import { TokensService } from './tokens.service';

@Module({
  imports: [UsersModule, JwtModule],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
